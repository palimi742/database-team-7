import express from "express";
import { activeCustomerId } from "../../auth/requireCustomer.js";
import { calculateRedemption } from "../../rewards/redeemPoints.js";

export default function (pool) {
  const router = express.Router();

  // Passes errors along
  const ah = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  //return logged-in person's CustomerID, or null.
  async function getCustomerId(req, res) {
    return activeCustomerId(req, res, pool);
  }

  //Fees
  const TAX_RATE = 0; // taxes
  const DELIVERY_FEE = 5.99;
  const FREE_DELIVERY_OVER = 50; // free delivery at or above this subtotal
  const POINTS_PER_DOLLAR = 1;
  const RETURN_WINDOW_DAYS = 14;

  router.use(
    ah(async (req, res, next) => {
      req.customerId = await getCustomerId(req, res);
      res.set("Cache-Control", "no-store");
      next();
    }),
  );

  function requireLogin(req, res, next) {
    if (!req.customerId)
      return res.status(401).json({ error: "Please log in." });
    next();
  }

  // Every cart route requires a login and a cart owned by that customer.
  router.param("cartId", async (req, res, next, cartId) => {
    try {
      if (!req.customerId)
        return res.status(401).json({ error: "Please log in." });
      const id = Number(cartId);
      if (!/^[1-9]\d*$/.test(cartId) || !Number.isSafeInteger(id)) {
        return res.status(404).json({ error: "Cart not found." });
      }
      const [[cart]] = await pool.query(
        "SELECT CartID, CustomerID FROM Cart WHERE CartID = ? AND CustomerID = ?",
        [id, req.customerId],
      );
      if (!cart) return res.status(404).json({ error: "Cart not found." });
      req.cart = { id: cart.CartID, customerId: cart.CustomerID };
      next();
    } catch (err) {
      next(err);
    }
  });

  // Shared SQL pieces
  const STATUS_SQL = `CASE
      WHEN f.FulfillmentID IS NULL THEN 'Completed'
      WHEN f.FulfillmentTime IS NOT NULL THEN 'Completed'
      WHEN f.ReadyStatus = 1 THEN 'Ready'
      ELSE 'Preparing' END`;

  // Quantity already returned or requested for an item
  const returnedQtySql = (itemRef) => `(
      (SELECT COALESCE(SUM(rr.Quantity), 0) FROM ReturnRequests rr
        WHERE rr.TransactionItemID = ${itemRef} AND rr.Status <> 'Rejected')
    + (SELECT COALESCE(SUM(pr.QuantityReturned), 0) FROM ProductReturns pr
        WHERE pr.TransactionItemID = ${itemRef}
          AND pr.ReturnID NOT IN (SELECT rr2.ReturnID FROM ReturnRequests rr2
                                  WHERE rr2.ReturnID IS NOT NULL))
  )`;

  function calcTotals(items, type) {
    const subtotal = items.reduce(
      (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity,
      0,
    );
    let fee = 0;
    if (
      type === "delivery" &&
      subtotal > 0 &&
      subtotal < FREE_DELIVERY_OVER * 100
    ) {
      fee = Math.round(DELIVERY_FEE * 100);
    }
    const tax = Math.round(subtotal * TAX_RATE);
    return {
      subtotal: subtotal / 100,
      deliveryFee: fee / 100,
      tax: tax / 100,
      total: (subtotal + fee + tax) / 100,
      points: Math.floor(subtotal / 100) * POINTS_PER_DOLLAR,
    };
  }

  async function getCartItems(db, cartId, forUpdate = false) {
    const [rows] = await db.query(
      `SELECT i.InventoryID AS productId, i.InventoryName AS name, i.Price AS price,
              i.StockQuantity AS stock, i.IsActive AS isActive, cd.Quantity AS quantity,
              i.Price * cd.Quantity AS lineTotal
       FROM CartDetail cd
       JOIN Inventory i ON i.InventoryID = cd.InventoryID
       WHERE cd.CartID = ? ${forUpdate ? "FOR UPDATE" : ""}`,
      [cartId],
    );
    return rows;
  }

  async function cartResponse(cartId) {
    const items = await getCartItems(pool, cartId);
    const subtotal =
      items.reduce(
        (sum, item) =>
          sum + Math.round(Number(item.price) * 100) * Number(item.quantity),
        0,
      ) / 100;
    return { items, subtotal };
  }

  // Who is logged in
  router.get(
    "/shop-me",
    requireLogin,
    ah(async (req, res) => {
      const [[me]] = await pool.query(
        `SELECT CustomerID AS id, FirstName AS firstName, LastName AS lastName,
              PhoneNumber AS phone, CustomerAddress AS address
       FROM Customer WHERE CustomerID = ?`,
        [req.customerId],
      );
      if (!me) return res.status(401).json({ error: "Please log in." });
      res.json(me);
    }),
  );

  // Products
  router.get(
    "/products",
    ah(async (req, res) => {
      const [rows] = await pool.query(
        `SELECT i.InventoryID AS id, i.InventoryName AS name, i.Price AS price,
              i.StockQuantity AS stock, c.CategoryName AS category
       FROM Inventory i
       JOIN Category c ON c.CategoryID = i.CategoryID
       WHERE i.IsActive = TRUE
       ORDER BY c.CategoryName, i.InventoryName`,
      );
      res.json(rows);
    }),
  );

  // Cart
  router.post(
    "/cart",
    requireLogin,
    ah(async (req, res) => {
      const [result] = await pool.query(
        `INSERT INTO Cart (CustomerID) VALUES (?)
         ON DUPLICATE KEY UPDATE CartID = LAST_INSERT_ID(CartID)`,
        [req.customerId],
      );
      res.json({ cartId: result.insertId });
    }),
  );

  router.get(
    "/cart/:cartId",
    ah(async (req, res) => {
      const items = await getCartItems(pool, req.cart.id);
      const subtotal =
        items.reduce(
          (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity,
          0,
        ) / 100;
      res.json({ items, subtotal });
    }),
  );

  router.post(
    "/cart/:cartId/items",
    ah(async (req, res) => {
      const productId = Number(req.body.productId);
      const quantity = Number(req.body.quantity ?? 1);
      if (
        !Number.isInteger(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({ error: "Invalid product or quantity." });
      }
      const [[product]] = await pool.query(
        `SELECT i.StockQuantity, COALESCE(cd.Quantity, 0) AS CartQuantity
         FROM Inventory i
         LEFT JOIN CartDetail cd
           ON cd.InventoryID = i.InventoryID AND cd.CartID = ?
         WHERE i.InventoryID = ? AND i.IsActive = TRUE`,
        [req.cart.id, productId],
      );
      if (!product)
        return res.status(404).json({ error: "Product not found." });

      const inCart = Number(product.CartQuantity);
      if (inCart + quantity > product.StockQuantity) {
        return res
          .status(400)
          .json({ error: `Only ${product.StockQuantity} in stock.` });
      }

      await pool.query(
        `INSERT INTO CartDetail (CartID, InventoryID, Quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Quantity = Quantity + ?`,
        [req.cart.id, productId, quantity, quantity],
      );
      const items = await getCartItems(pool, req.cart.id);
      const subtotal =
        items.reduce(
          (sum, item) =>
            sum + Math.round(Number(item.price) * 100) * Number(item.quantity),
          0,
        ) / 100;
      res.json({ items, subtotal });
    }),
  );

  router.put(
    "/cart/:cartId/items/:productId",
    ah(async (req, res) => {
      const quantity = Number(req.body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        await pool.query(
          "DELETE FROM CartDetail WHERE CartID = ? AND InventoryID = ?",
          [req.cart.id, req.params.productId],
        );
        return res.json(await cartResponse(req.cart.id));
      }
      const [[product]] = await pool.query(
        "SELECT StockQuantity FROM Inventory WHERE InventoryID = ? AND IsActive = TRUE",
        [req.params.productId],
      );
      if (!product)
        return res.status(404).json({ error: "Product not found." });
      if (quantity > product.StockQuantity) {
        return res
          .status(400)
          .json({ error: `Only ${product.StockQuantity} in stock.` });
      }
      await pool.query(
        "UPDATE CartDetail SET Quantity = ? WHERE CartID = ? AND InventoryID = ?",
        [quantity, req.cart.id, req.params.productId],
      );
      res.json(await cartResponse(req.cart.id));
    }),
  );

  router.delete(
    "/cart/:cartId/items/:productId",
    ah(async (req, res) => {
      await pool.query(
        "DELETE FROM CartDetail WHERE CartID = ? AND InventoryID = ?",
        [req.cart.id, req.params.productId],
      );
      res.json(await cartResponse(req.cart.id));
    }),
  );

  router.delete(
    "/cart/:cartId",
    ah(async (req, res) => {
      await pool.query("DELETE FROM CartDetail WHERE CartID = ?", [
        req.cart.id,
      ]);
      res.json(await cartResponse(req.cart.id));
    }),
  );

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
      const { fulfillmentType, deliveryAddress, paymentMethod, redeemPoints, pointsToRedeem } = req.body;
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
        const unavailable = items.find((i) => !Number(i.isActive));
        if (unavailable) {
          await conn.rollback();
          return res.status(400).json({
            error: `"${unavailable.name}" is no longer available. Remove it from your cart to continue.`,
          });
        }
        const short = items.find((i) => i.quantity > i.stock);
        if (short) {
          await conn.rollback();
          return res.status(400).json({
            error: `Only ${short.stock} of "${short.name}" left in stock.`,
          });
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
            redemption = calculateRedemption(currentPoints, t.subtotal, pointsToRedeem ?? null);
          } catch (err) {
            await conn.rollback();
            return res.status(400).json({ error: err.message });
          }
          if (redemption.pointsUsed === 0) {
            await conn.rollback();
            return res.status(400).json({
              error: "No reward is available for this order. Uncheck Redeem points and try again.",
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

        for (const i of items) {
          await conn.query(
            "UPDATE Inventory SET StockQuantity = StockQuantity - ? WHERE InventoryID = ?",
            [i.quantity, i.productId],
          );
        }

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
        console.error(err);
        res
          .status(500)
          .json({ error: "Could not place your order. Please try again." });
      } finally {
        conn.release();
      }
    }),
  );

  // Order history
  router.get(
    "/my-orders",
    requireLogin,
    ah(async (req, res) => {
      const [rows] = await pool.query(
        `SELECT t.TransactionID AS id, t.TotalPrice AS total,
              DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
              d.DeliveryName AS fulfillmentType, ${STATUS_SQL} AS status
       FROM Transactions t
       LEFT JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
       LEFT JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
       WHERE t.CustomerID = ?
       ORDER BY t.TransactionID DESC`,
        [req.customerId],
      );
      res.json(rows);
    }),
  );

  // Order details, purchased items, and completed returns.
  router.get(
    "/my-orders/:orderId",
    requireLogin,
    ah(async (req, res) => {
      const [orderRows] = await pool.query(
        `SELECT purchase.TransactionID AS id,
                DATE_FORMAT(purchase.TransactionDate, '%Y-%m-%d') AS orderDate,
                purchase.TransactionMethod AS paymentMethod,
                purchase.TotalPrice AS total, purchase.PointsEarned AS points,
                purchase.DeliveryFee AS savedDeliveryFee,
                purchase.LoyaltyDiscount AS savedLoyaltyDiscount,
                purchase.PointsRedeemed AS pointsRedeemed,
                (SELECT COALESCE(SUM(orderItem.UnitPrice * orderItem.Quantity), 0)
                 FROM TransactionItems AS orderItem
                 WHERE orderItem.TransactionID = purchase.TransactionID) AS subtotal,
                customer.FirstName AS firstName, customer.LastName AS lastName,
                customer.PhoneNumber AS phone,
                deliveryType.DeliveryName AS fulfillmentType,
                fulfillment.DeliveryAddress AS deliveryAddress,
                CASE
                  WHEN fulfillment.FulfillmentID IS NULL THEN 'Completed'
                  WHEN fulfillment.FulfillmentTime IS NOT NULL THEN 'Completed'
                  WHEN fulfillment.ReadyStatus = 1 THEN 'Ready'
                  ELSE 'Preparing'
                END AS status
         FROM Transactions AS purchase
         JOIN Customer AS customer ON customer.CustomerID = purchase.CustomerID
         LEFT JOIN OrderFulfillment AS fulfillment
           ON fulfillment.TransactionID = purchase.TransactionID
         LEFT JOIN DeliveryType AS deliveryType
           ON deliveryType.DeliveryID = fulfillment.DeliveryID
         WHERE purchase.TransactionID = ? AND purchase.CustomerID = ?`,
        [req.params.orderId, req.customerId],
      );
      const order = orderRows[0];
      if (!order) return res.status(404).json({ error: "Order not found." });

      const [orderItems] = await pool.query(
        `SELECT orderItem.TransactionItemID AS id,
                product.InventoryName AS name, orderItem.Quantity AS quantity,
                orderItem.UnitPrice AS unitPrice,
                CAST(${returnedQtySql("orderItem.TransactionItemID")} AS SIGNED) AS returnedQty
         FROM TransactionItems AS orderItem
         JOIN Inventory AS product ON product.InventoryID = orderItem.InventoryID
         WHERE orderItem.TransactionID = ?`,
        [order.id],
      );
      const [returnRequests] = await pool.query(
        `SELECT returnRequest.ReturnRequestID AS id,
                returnRequest.Quantity AS quantity,
                returnRequest.ExpectedRefund AS refundTotal,
                returnRequest.Reason AS reason,
                returnRequest.Status AS status,
                product.InventoryName AS name
         FROM ReturnRequests AS returnRequest
         JOIN TransactionItems AS orderItem
           ON orderItem.TransactionItemID = returnRequest.TransactionItemID
         JOIN Inventory AS product ON product.InventoryID = orderItem.InventoryID
         WHERE orderItem.TransactionID = ?
         ORDER BY returnRequest.ReturnRequestID DESC`,
        [order.id],
      );

      const deliveryFee = Math.max(
        0,
        Math.round((Number(order.total) - Number(order.subtotal)) * 100) / 100,
      );
      res.json({
        ...order,
        // Older orders did not retain fees or redemption amounts. Preserve their
        // existing fee calculation and explain any net discount without inventing
        // a points count or applying today's delivery pricing to past orders.
        deliveryFee: Number(order.savedDeliveryFee ?? deliveryFee),
        loyaltyDiscount: Number(order.savedLoyaltyDiscount ?? Math.max(
          0,
          Math.round((Number(order.subtotal) - Number(order.total)) * 100) / 100,
        )),
        redemptionEstimated: order.savedLoyaltyDiscount == null,
        items: orderItems,
        returns: returnRequests,
        returnWindowDays: RETURN_WINDOW_DAYS,
      });
    }),
  );

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

  // Errors from these routes come back as JSON
  router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  });

  return router;
}
