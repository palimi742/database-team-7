import { Router } from "express";
import pool from "../db.js";

const router = Router();

// Get all orders assigned to an employee
router.get("/:employeeId", async (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({
      message: "Invalid employee ID"
    });
  }

  try {
    const [employees] = await pool.query(
      `SELECT EmployeeID, FirstName, LastName
       FROM Employee
       WHERE EmployeeID = ? AND EmployeeRole != 'Manager'`,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

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
      [employeeId]
    );

    const transactionIds = orders.map(
      order => order.TransactionID
    );

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
        [transactionIds]
      );

      items = results;
    }

    const assignedOrders = orders.map(order => ({
      ...order,

      items: items.filter(
        item => item.TransactionID === order.TransactionID
      ),

      status: order.FulfillmentTime
        ? "Completed"
        : order.ReadyStatus
          ? "Ready"
          : "Assigned"
    }));

    res.json({
      employee: employees[0],
      orders: assignedOrders
    });

  } catch (error) {
    console.error("Error loading orders:", error);

    res.status(500).json({
      message: "Unable to load assigned orders"
    });
  }
});

// Employee marks an order as ready
router.patch("/:employeeId/orders/:orderId/ready", async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const orderId = Number(req.params.orderId);

  if (
    !Number.isSafeInteger(employeeId) || employeeId <= 0 ||
    !Number.isSafeInteger(orderId) || orderId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid employee or order ID"
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
      [orderId, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message: "Order cannot be marked ready"
      });
    }

    res.json({
      message: "Order is ready for delivery or pickup"
    });

  } catch (error) {
    console.error("Error updating order:", error);

    res.status(500).json({
      message: "Unable to update order"
    });
  }
});

// Employee completes the delivery or curbside pickup
router.patch("/:employeeId/orders/:orderId/complete", async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const orderId = Number(req.params.orderId);

  if (
    !Number.isSafeInteger(employeeId) || employeeId <= 0 ||
    !Number.isSafeInteger(orderId) || orderId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid employee or order ID"
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
      [orderId, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message: "Order must be ready before completion"
      });
    }

    res.json({
      message: "Order completed successfully"
    });

  } catch (error) {
    console.error("Error completing order:", error);

    res.status(500).json({
      message: "Unable to complete order"
    });
  }
});

export default router;
