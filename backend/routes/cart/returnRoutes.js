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

      const [[item]] = await pool.query(
        `SELECT ti.TransactionItemID AS id, ti.Quantity AS quantity, ti.UnitPrice AS unitPrice,
              CAST(${returnedQtySql("ti.TransactionItemID")} AS SIGNED) AS returned
       FROM TransactionItems ti
       WHERE ti.TransactionItemID = ? AND ti.TransactionID = ?`,
        [transactionItemId, order.id],
      );
      if (!item)
        return res.status(404).json({ error: "Item not found in this order." });

      const left = item.quantity - Number(item.returned);
      if (qty > left) {
        return res
          .status(400)
          .json({ error: `You can return at most ${left} of this item.` });
      }

      // Expected refund = item price x quantity
      const refund = (Math.round(Number(item.unitPrice) * 100) * qty) / 100;

      await pool.query(
        `INSERT INTO ReturnRequests (TransactionItemID, Quantity, Reason, Details, ExpectedRefund)
       VALUES (?, ?, ?, ?, ?)`,
        [
          item.id,
          qty,
          String(reason).slice(0, 50),
          details?.trim().slice(0, 500) || null,
          refund,
        ],
      );
      res.json({ ok: true });
    }),
  );

}
