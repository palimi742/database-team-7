import { Router } from "express";
import pool from "../db.js";
const router = Router();

router.get("/", async (req, res) => {
  const status = req.query.status ?? "Requested";
  if (!["Requested", "Approved", "Rejected"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Choose Pending, Approved, or Rejected returns" });
  }
  try {
    const [returnRequests] = await pool.query(
      `SELECT r.ReturnRequestID, r.TransactionItemID, r.Quantity, r.Reason,
              r.Details, r.ExpectedRefund, r.Status, r.RequestedAt,
              t.TransactionID, t.CustomerID, c.CartID,
              i.InventoryName AS ProductName, pr.RefundTotal, pr.Disposable,
              DATE_FORMAT(pr.ReturnDate, '%Y-%m-%d') AS ReturnDate,
              DATE_FORMAT(r.TableUpdateTime, '%Y-%m-%d') AS ReviewedDate
       FROM ReturnRequests r
       JOIN TransactionItems ti ON ti.TransactionItemID = r.TransactionItemID
       JOIN Transactions t ON t.TransactionID = ti.TransactionID
       LEFT JOIN Cart c ON c.CustomerID = t.CustomerID
       JOIN Inventory i ON i.InventoryID = ti.InventoryID
       LEFT JOIN ProductReturns pr ON pr.ReturnID = r.ReturnID
       WHERE r.Status = ?
       ORDER BY COALESCE(pr.ReturnDate, r.RequestedAt) DESC, r.ReturnRequestID DESC`,
      [status],
    );
    res.json(returnRequests);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to load return requests" });
  }
});

router.patch("/:returnRequestId/approve", async (req, res) => {
  const returnRequestId = Number(req.params.returnRequestId);
  if (!Number.isInteger(returnRequestId) || returnRequestId <= 0) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const { disposable } = req.body || {};
  if (typeof disposable !== "boolean") {
    return res
      .status(400)
      .json({ message: "Choose whether the item should be disposed of" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requestRows] = await connection.query(
      `SELECT ReturnRequestID, TransactionItemID, Quantity
       FROM ReturnRequests
       WHERE ReturnRequestID = ? AND Status = 'Requested'
       FOR UPDATE`,
      [returnRequestId],
    );
    const returnRequest = requestRows[0];
    if (!returnRequest) {
      await connection.rollback();
      return res.status(400).json({
        message: "Request has already been reviewed or does not exist",
      });
    }

    // Lock the purchased item so two approvals cannot exceed its quantity.
    const [itemRows] = await connection.query(
      `SELECT InventoryID, Quantity, UnitPrice FROM TransactionItems
       WHERE TransactionItemID = ? FOR UPDATE`,
      [returnRequest.TransactionItemID],
    );
    const orderItem = itemRows[0];
    if (!orderItem) {
      await connection.rollback();
      return res.status(404).json({ message: "Purchased item not found" });
    }

    const [returnRows] = await connection.query(
      `SELECT COALESCE(SUM(QuantityReturned), 0) AS returnedQuantity
       FROM ProductReturns
       WHERE TransactionItemID = ? AND Status = 'Approved'`,
      [returnRequest.TransactionItemID],
    );
    const requestedQuantity = Number(returnRequest.Quantity);
    const returnedQuantity = Number(returnRows[0].returnedQuantity);
    if (
      requestedQuantity <= 0 ||
      requestedQuantity + returnedQuantity > Number(orderItem.Quantity)
    ) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Return quantity exceeds the purchased quantity" });
    }

    const refundTotal =
      (Math.round(Number(orderItem.UnitPrice) * 100) * requestedQuantity) / 100;
    const [savedReturn] = await connection.query(
      `INSERT INTO ProductReturns
       (TransactionItemID, QuantityReturned, RefundTotal, ReturnDate, Disposable, Status, Reason)
       SELECT TransactionItemID, Quantity, ?, NOW(), ?, 'Approved', Reason
       FROM ReturnRequests WHERE ReturnRequestID = ?`,
      [refundTotal, disposable ? 1 : 0, returnRequestId],
    );
    await connection.query(
      `UPDATE ReturnRequests
       SET Status = 'Approved', ReturnID = ?, TableUpdateTime = NOW()
       WHERE ReturnRequestID = ?`,
      [savedReturn.insertId, returnRequestId],
    );

    if (!disposable) {
      await connection.query(
        "UPDATE Inventory SET StockQuantity = StockQuantity + ? WHERE InventoryID = ?",
        [requestedQuantity, orderItem.InventoryID],
      );
    }

    await connection.commit();
    res.json({ message: "Return request approved" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error.message);
    res.status(500).json({
      message:
        error.sqlState === "45000"
          ? error.sqlMessage
          : "Unable to approve return request",
    });
  } finally {
    if (connection) connection.release();
  }
});

router.patch("/:returnRequestId/decline", async (req, res) => {
  const returnRequestId = Number(req.params.returnRequestId);
  if (!Number.isInteger(returnRequestId) || returnRequestId <= 0) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  try {
    const [result] = await pool.query(
      `UPDATE ReturnRequests
       SET Status = 'Rejected', TableUpdateTime = NOW()
       WHERE ReturnRequestID = ? AND Status = 'Requested'`,
      [returnRequestId],
    );
    if (!result.affectedRows) {
      return res.status(400).json({
        message: "Request has already been reviewed or does not exist",
      });
    }
    res.json({ message: "Return request rejected" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Unable to reject return request" });
  }
});

export default router;
