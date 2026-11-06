import { asyncHandler as ah, requireLogin } from "./cartMiddleware.js";
import { calcTotals, getCartItems } from "./cartHelpers.js";
import { calculateRedemption } from "../../rewards/redeemPoints.js";
import { handleDatabaseTriggerError } from "../../errors/databaseCartStockTrigger.js";

export function registerCheckoutRoutes(router, pool) {
  // Customer contact details for the authenticated customer’s cart.
  router.get(
    "/cart/:cartId/contact",
    ah(async (req, res) => {
      const [[customer]] = await pool.query(
        `SELECT c.CustomerID AS id, c.FirstName AS firstName,
                c.LastName AS lastName, c.PhoneNumber AS phone,
                c.CustomerAddress AS address
         FROM Cart ca
         JOIN Customer c ON c.CustomerID = ca.CustomerID
         WHERE ca.CartID = ?`,
        [req.cart.id],
      );
      if (!customer)
        return res.status(404).json({ error: "Customer not found." });
      res.json(customer);
    }),
  );

  // Checkout summary
  router.get(
    "/cart/:cartId/summary",
    ah(async (req, res) => {
      const type = req.query.type === "curbside" ? "curbside" : "delivery";
      const items = await getCartItems(pool, req.cart.id);
      const totals = calcTotals(items, type);

      const [members] = await pool.query(
        `SELECT CurrentPoints FROM LoyaltyProgram WHERE CustomerID = ?`,
        [req.customerId],
      );
      const currentPoints = Number(members[0]?.CurrentPoints || 0);

      const redemption = calculateRedemption(currentPoints, totals.subtotal);

      res.json({
        items,
        ...totals,
        rewards: {
          isMember: members.length > 0,
          currentPoints,
          discount: redemption.discount,
          pointsUsed: redemption.pointsUsed,
        },
      });
    }),
  );

  // Place order
  router.post(
    "/cart/:cartId/checkout",
    requireLogin,
    (req, res, next) => {
      if (Number(req.cart.customerId) !== req.customerId) {
        return res
          .status(403)
          .json({ error: "This cart belongs to another customer." });
      }
      next();
    },
    ah(async (req, res) => {
      const {
        fulfillmentType,
        deliveryAddress,
        paymentMethod,
        redeemPoints,
        pointsToRedeem,
      } = req.body;
      if (!["delivery", "curbside"].includes(fulfillmentType)) {
        return res
          .status(400)
          .json({ error: "Choose delivery or curbside pickup." });
      }
      const isDelivery = fulfillmentType === "delivery";
      if (isDelivery && !deliveryAddress?.trim()) {
        return res.status(400).json({ error: "Enter a delivery address." });
      }
      const addressText = isDelivery
        ? deliveryAddress.trim().slice(0, 150)
        : null;

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const items = await getCartItems(conn, req.cart.id, true);
        if (items.length === 0) {
          await conn.rollback();
          return res.status(400).json({ error: "Your cart is empty." });
        }
        const [[delivery]] = await conn.query(
          "SELECT DeliveryID FROM DeliveryType WHERE DeliveryName LIKE ? ORDER BY DeliveryID LIMIT 1",
          [isDelivery ? "%deliver%" : "%curb%"],
        );
        if (!delivery) {
          await conn.rollback();
          return res.status(500).json({
            error:
              'DeliveryType needs a row with "Delivery" in its name and one with "Curb" in its name.',
          });
        }

        const t = calcTotals(items, fulfillmentType);
        const [members] = await conn.query(
          `SELECT CurrentPoints FROM LoyaltyProgram
           WHERE CustomerID = ? FOR UPDATE`,
          [req.customerId],
        );

        let pointsUsed = 0;
        let loyaltyDiscount = 0;
        if (redeemPoints === true) {
          const currentPoints = Number(members[0]?.CurrentPoints || 0);
          let redemption;
          try {
            redemption = calculateRedemption(
              currentPoints,
              t.subtotal,
              pointsToRedeem ?? null,
            );
          } catch (err) {
            await conn.rollback();
            return res.status(400).json({ error: err.message });
          }
          if (redemption.pointsUsed === 0) {
            await conn.rollback();
            return res.status(400).json({
              error:
                "No reward is available for this order. Uncheck Redeem points and try again.",
            });
          }
          pointsUsed = redemption.pointsUsed;
          loyaltyDiscount = redemption.discount;
          t.total = Math.round((t.total - loyaltyDiscount) * 100) / 100;
        }

        const [sale] = await conn.query(
          `INSERT INTO Transactions
          (CustomerID, TransactionMethod, TotalPrice, TransactionDate, PointsEarned,
           DeliveryFee, LoyaltyDiscount, PointsRedeemed)
         VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)`,
          [
            req.customerId,
            isDelivery ? "Pay on delivery" : "Pay at pickup",
            t.total,
            t.points,
            t.deliveryFee,
            loyaltyDiscount,
            pointsUsed,
          ],
        );
        const orderId = sale.insertId;

        await conn.query(
          "INSERT INTO TransactionItems (TransactionID, InventoryID, Quantity, UnitPrice) VALUES ?",
          [items.map((i) => [orderId, i.productId, i.quantity, i.price])],
        );

        await conn.query(
          `INSERT INTO OrderFulfillment
          (TransactionID, EmployeeID, DeliveryID, FulfillmentTime, ReadyStatus, DeliveryAddress)
         VALUES (?, ?, ?, NULL, 0, ?)`,
          [orderId, null, delivery.DeliveryID, addressText],
        );

        // Earn and redeem points only when the order transaction succeeds.
        await conn.query(
          `UPDATE LoyaltyProgram
         SET CurrentPoints = CurrentPoints - ? + ?,
             TotalPointsEarned = TotalPointsEarned + ?,
             TotalPointsRedeemed = TotalPointsRedeemed + ?,
             LastActivityDate = NOW()
         WHERE CustomerID = ?`,
          [pointsUsed, t.points, t.points, pointsUsed, req.customerId],
        );

        await conn.query("DELETE FROM CartDetail WHERE CartID = ?", [
          req.cart.id,
        ]);

        await conn.commit();
        res.json({ orderId });
      } catch (err) {
        await conn.rollback();
        if (await handleDatabaseTriggerError(err, res, conn, req.cart.id)) return;
        console.error(err);
        res
          .status(500)
          .json({ error: "Could not place your order. Please try again." });
      } finally {
        conn.release();
      }
    }),
  );
}
