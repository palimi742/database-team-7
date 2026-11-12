import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";

const router = Router();
const issueTypes = new Set([
  "Missing item",
  "Damaged product",
  "Pickup no-show",
  "Delivery problem",
  "Other",
]);

function validId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

// Serialize packing edits and status changes on the same fulfillment row.
async function changePacking(req, res, next, change) {
  const orderId = Number(req.params.orderId);
  if (!validId(orderId)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[order]] = await connection.query(
      `SELECT TransactionID, ReadyStatus, FulfillmentTime
       FROM OrderFulfillment WHERE FulfillmentID = ? AND EmployeeID = ? FOR UPDATE`,
      [orderId, req.employee.EmployeeID],
    );
    if (!order || order.ReadyStatus || order.FulfillmentTime) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "This order is unavailable for packing." });
    }
    const result = await change(connection, orderId, order.TransactionID);
    if (result.status >= 400) {
      await connection.rollback();
    } else {
      await connection.commit();
    }
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Packing rollback failed:", rollbackError.message);
      }
    }
    next(error);
  } finally {
    connection?.release();
  }
}

// Every route below requires a verified staff login.
router.use(requireStaff);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Load only the signed-in employee's assigned orders.
router.get("/", async (req, res) => {
  const employeeId = req.employee.EmployeeID;

  try {
    const [orders] = await pool.query(
      `SELECT
         o.FulfillmentID,
         o.TransactionID,
         o.DeliveryAddress,
         o.ReadyStatus,
         o.FulfillmentTime,
         d.DeliveryName,
         t.TotalPrice,
         t.TransactionDate,
         c.FirstName AS CustomerFirstName,
         c.LastName AS CustomerLastName
       FROM OrderFulfillment o
       JOIN DeliveryType d ON o.DeliveryID = d.DeliveryID
       JOIN Transactions t ON o.TransactionID = t.TransactionID
       JOIN Customer c ON t.CustomerID = c.CustomerID
       WHERE o.EmployeeID = ?
       ORDER BY o.FulfillmentID DESC`,
      [employeeId],
    );

    const fulfillmentIds = orders.map((order) => order.FulfillmentID);
    let items = [];
    let issues = [];

    if (fulfillmentIds.length) {
      const [[itemRows], [issueRows]] = await Promise.all([
        pool.query(
          `SELECT o.FulfillmentID, ti.TransactionItemID, i.InventoryName, ti.Quantity,
                  p.TransactionItemID IS NOT NULL AS Packed
           FROM OrderFulfillment o
           JOIN TransactionItems ti ON ti.TransactionID = o.TransactionID
           JOIN Inventory i ON i.InventoryID = ti.InventoryID
           LEFT JOIN OrderPackedItems p
             ON p.FulfillmentID = o.FulfillmentID AND p.TransactionItemID = ti.TransactionItemID
           WHERE o.EmployeeID = ? AND o.FulfillmentID IN (?)
           ORDER BY ti.TransactionItemID`,
          [employeeId, fulfillmentIds],
        ),
        pool.query(
          `SELECT i.IssueID, i.FulfillmentID, i.IssueType, i.Details, i.ManagerResponse
           FROM OrderIssues i
           JOIN OrderFulfillment o ON o.FulfillmentID = i.FulfillmentID
           WHERE i.ReportedByEmployeeID = ? AND o.EmployeeID = ? AND i.FulfillmentID IN (?)
           ORDER BY i.IssueID DESC`,
          [employeeId, employeeId, fulfillmentIds],
        ),
      ]);
      items = itemRows;
      issues = issueRows;
    }

    const assignedOrders = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.FulfillmentID === order.FulfillmentID),
      issues: issues.filter(
        (issue) => issue.FulfillmentID === order.FulfillmentID,
      ),
      status: order.FulfillmentTime
        ? "Completed"
        : Number(order.ReadyStatus) === 1
          ? "Ready"
          : "Assigned",
    }));

    res.json({
      employee: req.employee,
      orders: assignedOrders,
    });
  } catch (error) {
    console.error("Error loading orders:", error.message);

    res.status(500).json({
      message: "Unable to load assigned orders.",
    });
  }
});

router.patch("/orders/:orderId/items/:itemId", (req, res, next) => {
  const itemId = Number(req.params.itemId);
  const packed = req.body?.packed;
  if (!validId(itemId) || typeof packed !== "boolean") {
    return res.status(400).json({ message: "Invalid packing update." });
  }

  return changePacking(
    req,
    res,
    next,
    async (connection, orderId, transactionId) => {
      const [[item]] = await connection.query(
        "SELECT TransactionItemID FROM TransactionItems WHERE TransactionItemID = ? AND TransactionID = ?",
        [itemId, transactionId],
      );
      if (!item)
        return { status: 404, message: "This item is not part of the order." };

      if (packed) {
        await connection.query(
          `INSERT INTO OrderPackedItems (FulfillmentID, TransactionItemID) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE TransactionItemID = TransactionItemID`,
          [orderId, itemId],
        );
      } else {
        await connection.query(
          "DELETE FROM OrderPackedItems WHERE FulfillmentID = ? AND TransactionItemID = ?",
          [orderId, itemId],
        );
      }
      return { status: 200, message: "Packing checklist saved." };
    },
  );
});

router.patch("/orders/:orderId/ready", (req, res, next) =>
  changePacking(req, res, next, async (connection, orderId, transactionId) => {
    const [[unpacked]] = await connection.query(
      `SELECT ti.TransactionItemID
       FROM TransactionItems ti
       LEFT JOIN OrderPackedItems p
         ON p.FulfillmentID = ? AND p.TransactionItemID = ti.TransactionItemID
       WHERE ti.TransactionID = ? AND p.TransactionItemID IS NULL
       LIMIT 1`,
      [orderId, transactionId],
    );
    if (unpacked)
      return {
        status: 409,
        message: "Pack every item before marking the order ready.",
      };

    await connection.query(
      "UPDATE OrderFulfillment SET ReadyStatus = 1, TableUpdateTime = NOW() WHERE FulfillmentID = ?",
      [orderId],
    );
    return { status: 200, message: "Order is ready for delivery or pickup." };
  }),
);

router.post("/orders/:orderId/issues", async (req, res, next) => {
  const orderId = Number(req.params.orderId);
  const { issueType } = req.body ?? {};
  const details =
    typeof req.body?.details === "string" ? req.body.details.trim() : "";
  if (
    !validId(orderId) ||
    !issueTypes.has(issueType) ||
    !details ||
    details.length > 500
  ) {
    return res
      .status(400)
      .json({
        message: "Choose an issue type and enter up to 500 characters.",
      });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO OrderIssues (FulfillmentID, ReportedByEmployeeID, IssueType, Details)
       SELECT FulfillmentID, EmployeeID, ?, ? FROM OrderFulfillment
       WHERE FulfillmentID = ? AND EmployeeID = ? AND FulfillmentTime IS NULL`,
      [issueType, details, orderId, req.employee.EmployeeID],
    );
    if (!result.affectedRows) {
      return res
        .status(409)
        .json({ message: "This order is unavailable for issue reporting." });
    }
    res.status(201).json({ message: "Issue reported to the manager." });
  } catch (error) {
    next(error);
  }
});

// Complete an order only if it belongs to this employee
// and has already been marked ready.
router.patch("/orders/:orderId/complete", async (req, res) => {
  const employeeId = req.employee.EmployeeID;
  const orderId = Number(req.params.orderId);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: "Invalid order ID.",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE OrderFulfillment
       SET FulfillmentTime = NOW(),
           TableUpdateTime = NOW()
       WHERE FulfillmentID = ?
         AND EmployeeID = ?
         AND ReadyStatus = 1
         AND FulfillmentTime IS NULL`,
      [orderId, employeeId],
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "This order is unavailable or must be ready before completion.",
      });
    }

    res.json({
      message: "Order completed successfully.",
    });
  } catch (error) {
    console.error("Error completing order:", error.message);

    res.status(500).json({
      message: "Unable to complete order.",
    });
  }
});

export default router;
