import { Router } from "express";
import pool from "../../db.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.FulfillmentID, o.TransactionID,
             CASE WHEN o.FulfillmentTime IS NULL AND e.EmployeeRole = 'Manager'
                  THEN NULL ELSE o.EmployeeID END AS EmployeeID,
             d.DeliveryName, o.DeliveryAddress, e.FirstName, e.LastName,
             c.CustomerID, c.FirstName AS CustomerFirstName,
             c.LastName AS CustomerLastName,
             CASE WHEN o.FulfillmentTime IS NOT NULL THEN 'Completed'
                  WHEN o.EmployeeID IS NULL OR e.EmployeeRole = 'Manager'
                    THEN 'Needs Assignment'
                  ELSE 'Assigned' END AS Status
      FROM OrderFulfillment o
      JOIN Transactions t ON o.TransactionID = t.TransactionID
      JOIN Customer c ON t.CustomerID = c.CustomerID
      JOIN DeliveryType d ON o.DeliveryID = d.DeliveryID
      LEFT JOIN Employee e ON o.EmployeeID = e.EmployeeID
      ORDER BY o.FulfillmentID DESC`);
    res.json(orders);
  } catch (err) {
    console.error("Failed to load orders:", err.message);
    res.status(500).json({ message: "Unable to load orders for manager" });
  }
});

router.patch("/:fulfillmentID/assign", async (req, res) => {
  const fulfillmentID = Number(req.params.fulfillmentID);
  const employeeID = Number(req.body.employeeID);
  if (!Number.isSafeInteger(fulfillmentID) || fulfillmentID <= 0) {
    return res.status(400).json({ message: "Invalid fulfillment ID" });
  }
  if (!Number.isSafeInteger(employeeID) || employeeID <= 0) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Serialize assignments to each employee so concurrent requests cannot
    // both take their last available slot. Completed orders do not use slots.
    const [employees] = await connection.query(
      "SELECT EmployeeID FROM Employee WHERE EmployeeID = ? AND EmployeeRole != 'Manager' FOR UPDATE",
      [employeeID],
    );
    if (!employees.length) {
      await connection.rollback();
      return res.status(400).json({ message: "Choose an available employee" });
    }
    const [activeOrders] = await connection.query(
      `SELECT FulfillmentID FROM OrderFulfillment
       WHERE EmployeeID = ? AND FulfillmentTime IS NULL FOR UPDATE`,
      [employeeID],
    );
    if (activeOrders.length >= 5) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "This employee already has five active orders" });
    }

    const [orders] = await connection.query(
      `SELECT o.FulfillmentID, o.EmployeeID, o.FulfillmentTime, o.ReadyStatus,
              e.EmployeeRole
       FROM OrderFulfillment o
       LEFT JOIN Employee e ON e.EmployeeID = o.EmployeeID
       WHERE o.FulfillmentID = ? FOR UPDATE`,
      [fulfillmentID],
    );
    const order = orders[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ message: "Order not found" });
    }
    // Earlier checkouts used the first employee (a manager) as a placeholder.
    // Recover those pending orders without permitting reassignment of a real
    // employee's order or changes to ready/completed orders.
    if (
      order.FulfillmentTime != null ||
      Number(order.ReadyStatus) !== 0 ||
      (order.EmployeeID != null && order.EmployeeRole !== "Manager")
    ) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "Order already completed or assigned" });
    }

    await connection.query(
      `UPDATE OrderFulfillment
       SET EmployeeID = ?, Status = 'Assigned', TableUpdateTime = NOW()
       WHERE FulfillmentID = ?`,
      [employeeID, fulfillmentID],
    );
    await connection.commit();
    res.json({
      message: "Employee assigned to order",
      fulfillmentID,
      employeeID,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Assignment failed:", err.message);
    res.status(500).json({ message: "Unable to assign employee" });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
