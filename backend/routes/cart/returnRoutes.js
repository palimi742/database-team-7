import { asyncHandler as ah, requireLogin } from "./cartMiddleware.js";
import { returnedQtySql } from "./orderQueries.js";
import { RETURN_WINDOW_DAYS } from "./cartHelpers.js";

export function registerReturnRoutes(router, pool) {
  // Return requests
  router.post(
    "/my-orders/:orderId/returns",
    requireLogin,
    ah(async (req, res) => {
      const { transactionItemId, quantity, reason, details } = req.body;
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 1 || !reason) {
        return res
          .status(400)
          .json({ error: "Choose a quantity and a reason." });
      }

      const [[order]] = await pool.query(
        `SELECT TransactionID AS id, DATEDIFF(CURDATE(), TransactionDate) AS ageDays
       FROM Transactions WHERE TransactionID = ? AND CustomerID = ?`,
        [req.params.orderId, req.customerId],
      );
      if (!order) return res.status(404).json({ error: "Order not found." });
      if (order.ageDays > RETURN_WINDOW_DAYS) {
        return res.status(400).json({
          error: `The ${RETURN_WINDOW_DAYS}-day return window has passed.`,
        });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [[item]] = await connection.query(
          `SELECT TransactionItemID AS id, UnitPrice AS unitPrice, Quantity AS quantity
           FROM TransactionItems WHERE TransactionItemID = ? AND TransactionID = ? FOR UPDATE`,
          [transactionItemId, order.id],
        );
        if (!item) {
          await connection.rollback();
          return res.status(404).json({ error: "Item not found in this order." });
        }
        const [rejectedRequests] = await connection.query(
          `SELECT ReturnRequestID FROM ReturnRequests
           WHERE TransactionItemID = ? AND Status = 'Rejected' LIMIT 1`,
          [item.id],
        );
        if (rejectedRequests.length) {
          await connection.rollback();
          return res.status(400).json({ error: "This item's return request was rejected and cannot be resubmitted." });
        }
        const [[availability]] = await connection.query(
          `SELECT ${returnedQtySql("?")} AS reserved`, [item.id, item.id],
        );
        const remaining = Number(item.quantity) - Number(availability.reserved);
        const [[fulfillment]] = await connection.query(
          `SELECT FulfillmentID FROM OrderFulfillment
           WHERE TransactionID = ? AND FulfillmentTime IS NULL`, [order.id],
        );
        if (fulfillment) {
          await connection.rollback();
          return res.status(400).json({ error: "Returns are available after your order is completed." });
        }
        const refund = (Math.round(Number(item.unitPrice) * 100) * qty) / 100;
        await connection.query(
          `INSERT INTO ReturnRequests (TransactionItemID, Quantity, Reason, Details, ExpectedRefund)
           VALUES (?, ?, ?, ?, ?)`,
          [item.id, qty, String(reason).slice(0, 50), String(details || "").trim().slice(0, 500) || null, refund],
        );
        // Let the database trigger validate the purchased-quantity limit first.
        // Before committing, also account for previous returns, which the
        // simple trigger does not check. Rollback removes this new request.
        if (qty > remaining) {
          await connection.rollback();
          return res.status(400).json({ error: `You can return at most ${Math.max(0, remaining)} more item(s).` });
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        if (err.code === "ER_SIGNAL_EXCEPTION") {
          return res.status(400).json({ error: err.sqlMessage });
        }
        throw err;
      } finally {
        connection.release();
      }
      res.json({ ok: true });
    }),
  );

}
