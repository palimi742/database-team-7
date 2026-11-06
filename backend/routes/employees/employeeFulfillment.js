import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";

const router = Router();

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

    const transactionIds = orders.map((order) => order.TransactionID);

    let items = [];

    if (transactionIds.length > 0) {
      const [results] = await pool.query(
        `SELECT
           ti.TransactionID,
           i.InventoryName,
           ti.Quantity
         FROM TransactionItems ti
         JOIN Inventory i ON ti.InventoryID = i.InventoryID
         WHERE ti.TransactionID IN (?)`,
        [transactionIds],
      );

      items = results;
    }

    const assignedOrders = orders.map((order) => ({
      ...order,
      items: items.filter(
        (item) => item.TransactionID === order.TransactionID,
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

// Mark an order ready only if it belongs to this employee.
router.patch("/orders/:orderId/ready", async (req, res) => {
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
       SET ReadyStatus = 1,
           TableUpdateTime = NOW()
       WHERE FulfillmentID = ?
         AND EmployeeID = ?
         AND COALESCE(ReadyStatus, 0) = 0
         AND FulfillmentTime IS NULL`,
      [orderId, employeeId],
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "This order is unavailable or cannot be marked ready.",
      });
    }

    res.json({
      message: "Order is ready for delivery or pickup.",
    });
  } catch (error) {
    console.error("Error updating order:", error.message);

    res.status(500).json({
      message: "Unable to update order.",
    });
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