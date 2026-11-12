import { Router } from "express";
import pool from "../../db.js";
import { requireStaff, requireManager } from "../../auth/staffSession.js";

const router = Router();

// Verify both the login and the manager role.
router.use(requireStaff, requireManager);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Managers can view all employees' restock requests.
router.get("/", async (req, res) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : "Pending";

  const allowedStatuses = [
    "All",
    "Pending",
    "Approved",
    "Rejected",
    "Fulfilled",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid request status.",
    });
  }

  try {
    const whereClause = status === "All" ? "" : "WHERE r.Status = ?";

    const parameters = status === "All" ? [] : [status];

    const [requests] = await pool.query(
      `SELECT
         r.RequestID,
         r.InventoryID,
         i.InventoryName,
         i.SKU,
         i.StockQuantity AS CurrentStock,
         i.RestockTargetQuantity,
         r.RequestedQuantity,
         r.StockAtRequest,
         r.EmployeeNote,
         r.Status,
         r.CreatedAt,
         r.ReviewedAt,
         r.ManagerNote,
         r.FulfilledAt,
         requester.FirstName AS EmployeeFirstName,
         requester.LastName AS EmployeeLastName,
         reviewer.FirstName AS ManagerFirstName,
         reviewer.LastName AS ManagerLastName
       FROM RestockRequests r
       JOIN Inventory i
         ON i.InventoryID = r.InventoryID
       JOIN Employee requester
         ON requester.EmployeeID = r.RequestedByEmployeeID
       LEFT JOIN Employee reviewer
         ON reviewer.EmployeeID = r.ReviewedByEmployeeID
       ${whereClause}
       ORDER BY r.CreatedAt DESC, r.RequestID DESC`,
      parameters,
    );

    res.json({ requests });
  } catch (error) {
    console.error("Loading manager requests failed:", error.message);

    res.status(500).json({
      message: "Unable to load restock requests.",
    });
  }
});

// Approve or reject a pending request.
// Approval alone does not increase inventory.
router.patch("/:requestId/review", async (req, res) => {
  const requestId = Number(req.params.requestId);
  const { decision, note = "" } = req.body ?? {};

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      message: "Invalid request ID.",
    });
  }

  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      message: "Choose Approved or Rejected.",
    });
  }

  if (typeof note !== "string" || note.trim().length > 500) {
    return res.status(400).json({
      message: "Manager note must be 500 characters or fewer.",
    });
  }

  try {
    // The Pending condition prevents two managers from reviewing
    // the same request successfully.
    const [result] = await pool.query(
      `UPDATE RestockRequests
       SET Status = ?,
           ReviewedByEmployeeID = ?,
           ReviewedAt = CURRENT_TIMESTAMP,
           ManagerNote = ?
       WHERE RequestID = ?
         AND Status = 'Pending'`,
      [decision, req.employee.EmployeeID, note.trim() || null, requestId],
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "This request does not exist or has already been reviewed. Refresh the list.",
      });
    }

    // The database trigger automatically records the status change.
    res.json({
      message:
        decision === "Approved"
          ? "Restock request approved."
          : "Restock request rejected.",
    });
  } catch (error) {
    console.error("Reviewing restock request failed:", error.message);

    res.status(500).json({
      message: "Unable to review this restock request.",
    });
  }
});
// Receive the entire approved quantity once.
// Inventory and request status change in the same transaction.
router.patch("/:requestId/receive", async (req, res) => {
  const requestId = Number(req.params.requestId);

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      message: "Invalid request ID.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.query(
      `SELECT InventoryID, RequestedQuantity, Status
       FROM RestockRequests
       WHERE RequestID = ?
       FOR UPDATE`,
      [requestId],
    );

    if (requests.length === 0 || requests[0].Status !== "Approved") {
      await connection.rollback();

      return res.status(409).json({
        message:
          "Only approved requests can be received. This request may already be fulfilled.",
      });
    }

    const request = requests[0];

    const [result] = await connection.query(
      `UPDATE Inventory
       SET StockQuantity = StockQuantity + ?,
           TableUpdateTime = CURRENT_TIMESTAMP
       WHERE InventoryID = ?
         AND StockQuantity <= 2147483647 - ?`,
      [
        request.RequestedQuantity,
        request.InventoryID,
        request.RequestedQuantity,
      ],
    );

    if (result.affectedRows !== 1) {
      await connection.rollback();

      return res.status(409).json({
        message: "Unable to add this quantity to inventory.",
      });
    }

    await connection.query(
      `UPDATE RestockRequests
       SET Status = 'Fulfilled',
           FulfilledAt = CURRENT_TIMESTAMP
       WHERE RequestID = ?
         AND Status = 'Approved'`,
      [requestId],
    );

    await connection.commit();

    res.json({
      message: "Stock received. Inventory has been updated.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Receipt rollback failed:", rollbackError.message);
      }
    }

    console.error("Receiving stock failed:", error.message);

    res.status(500).json({
      message: "Unable to record received stock.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
export default router;
