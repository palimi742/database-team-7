const express = require('express');
const crypto = require('crypto');

module.exports = function (pool) {
  const router = express.Router();

  // Passes errors along instead of crashing the server
  const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  //return the logged-in person's CustomerID, or null.
  async function getCustomerId(req) {
    // OPTION A: your login saved the CustomerID
    const id = req.session?.customerId ?? req.user?.customerId ?? null;
    if (id != null) return Number(id);
    return null;
  }

  // security signs cart ids so carts can't be guessed.
  const CART_SECRET = process.env.CART_SECRET || 'most random secret here idk what could be longer so this is it';

  // the EmployeeID that online orders are assigned to at first.
  // Leave null to use the lowest EmployeeID. Staff can reassign later.
  const FULFILLMENT_EMPLOYEE_ID = null;

  //  Other settings 
  const TAX_RATE = 0;               // taxes
  const DELIVERY_FEE = 5.99;
  const FREE_DELIVERY_OVER = 50;    // free delivery at or above this subtotal
  const POINTS_PER_DOLLAR = 1;
  const RETURN_WINDOW_DAYS = 14;

  // Signed cart tokens 
  const sign = (id) =>
    crypto.createHmac('sha256', CART_SECRET).update(String(id)).digest('hex').slice(0, 32);
  const makeCartToken = (id) => `${id}.${sign(id)}`;
  function readCartToken(token) {
    const [id, sig] = String(token).split('.');
    if (!/^\d+$/.test(id || '') || !sig) return null;
    const expected = Buffer.from(sign(id));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    return Number(id);
  }

  router.use(ah(async (req, res, next) => {
    req.customerId = await getCustomerId(req);
    next();
  }));

  function requireLogin(req, res, next) {
    if (!req.customerId) return res.status(401).json({ error: 'Please log in.' });
    next();
  }

  // Every route with:cartId checks the signed token and that the cart exists
  router.param('cartId', async (req, res, next, token) => {
    try {
      const id = readCartToken(token);
      if (!id) return res.status(404).json({ error: 'Cart not found.' });
      const [[cart]] = await pool.query('SELECT CartID FROM Cart WHERE CartID = ?', [id]);
      if (!cart) return res.status(404).json({ error: 'Cart not found.' });
      req.cart = { id: cart.CartID };
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
      (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity, 0
    );
    let fee = 0;
    if (type === 'delivery' && subtotal > 0 && subtotal < FREE_DELIVERY_OVER * 100) {
      fee = Math.round(DELIVERY_FEE * 100);
    }
    const tax = Math.round(subtotal * TAX_RATE);
    return {
      subtotal: subtotal / 100,
      deliveryFee: fee / 100,
      tax: tax / 100,
      total: (subtotal + fee + tax) / 100,
      points: Math.floor(subtotal / 100) * POINTS_PER_DOLLAR
    };
  }

  async function getCartItems(db, cartId, forUpdate = false) {
    const [rows] = await db.query(
      `SELECT i.InventoryID AS productId, i.InventoryName AS name, i.Price AS price,
              i.StockQuantity AS stock, cd.Quantity AS quantity,
              i.Price * cd.Quantity AS lineTotal
       FROM CartDetail cd
       JOIN Inventory i ON i.InventoryID = cd.ProductID
       WHERE cd.CartID = ? ${forUpdate ? 'FOR UPDATE' : ''}`,
      [cartId]
    );
    return rows;
  }

  // Who is logged in 
  router.get('/shop-me', requireLogin, ah(async (req, res) => {
    const [[me]] = await pool.query(
      `SELECT CustomerID AS id, FirstName AS firstName, LastName AS lastName,
              PhoneNumber AS phone, CustomerAddress AS address
       FROM Customer WHERE CustomerID = ?`,
      [req.customerId]
    );
    if (!me) return res.status(401).json({ error: 'Please log in.' });
    res.json(me);
  }));

  // Products 
  router.get('/products', ah(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT i.InventoryID AS id, i.InventoryName AS name, i.Price AS price,
              i.StockQuantity AS stock, c.CategoryName AS category
       FROM Inventory i
       JOIN Category c ON c.CategoryID = i.CategoryID
       ORDER BY c.CategoryName, i.InventoryName`
    );
    res.json(rows);
  }));

  // Cart 
  router.post('/cart', ah(async (req, res) => {
    const [result] = await pool.query('INSERT INTO Cart () VALUES ()');
    res.json({ cartId: makeCartToken(result.insertId) });
  }));

  router.get('/cart/:cartId', ah(async (req, res) => {
    const items = await getCartItems(pool, req.cart.id);
    const subtotal = items.reduce(
      (sum, i) => sum + Math.round(Number(i.price) * 100) * i.quantity, 0
    ) / 100;
    res.json({ items, subtotal });
  }));

  router.post('/cart/:cartId/items', ah(async (req, res) => {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity ?? 1);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Invalid product or quantity.' });
    }
    const [[product]] = await pool.query(
      'SELECT StockQuantity FROM Inventory WHERE InventoryID = ?', [productId]
    );
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const [[line]] = await pool.query(
      'SELECT Quantity FROM CartDetail WHERE CartID = ? AND ProductID = ?',
      [req.cart.id, productId]
    );
    const inCart = line ? line.Quantity : 0;
    if (inCart + quantity > product.StockQuantity) {
      return res.status(400).json({ error: `Only ${product.StockQuantity} in stock.` });
    }

    await pool.query(
      `INSERT INTO CartDetail (CartID, ProductID, Quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Quantity = Quantity + ?`,
      [req.cart.id, productId, quantity, quantity]
    );
    res.json({ ok: true });
  }));

  router.put('/cart/:cartId/items/:productId', ah(async (req, res) => {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      await pool.query(
        'DELETE FROM CartDetail WHERE CartID = ? AND ProductID = ?',
        [req.cart.id, req.params.productId]
      );
      return res.json({ ok: true });
    }
    const [[product]] = await pool.query(
      'SELECT StockQuantity FROM Inventory WHERE InventoryID = ?', [req.params.productId]
    );
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (quantity > product.StockQuantity) {
      return res.status(400).json({ error: `Only ${product.StockQuantity} in stock.` });
    }
    await pool.query(
      'UPDATE CartDetail SET Quantity = ? WHERE CartID = ? AND ProductID = ?',
      [quantity, req.cart.id, req.params.productId]
    );
    res.json({ ok: true });
  }));

  router.delete('/cart/:cartId/items/:productId', ah(async (req, res) => {
    await pool.query(
      'DELETE FROM CartDetail WHERE CartID = ? AND ProductID = ?',
      [req.cart.id, req.params.productId]
    );
    res.json({ ok: true });
  }));

  router.delete('/cart/:cartId', ah(async (req, res) => {
    await pool.query('DELETE FROM CartDetail WHERE CartID = ?', [req.cart.id]);
    res.json({ ok: true });
  }));

  // Checkout summary 
  router.get('/cart/:cartId/summary', ah(async (req, res) => {
    const type = req.query.type === 'curbside' ? 'curbside' : 'delivery';
    const items = await getCartItems(pool, req.cart.id);
    res.json({ items, ...calcTotals(items, type) });
  }));

  // Place order
  router.post('/cart/:cartId/checkout', requireLogin, ah(async (req, res) => {
        const { fulfillmentType, deliveryAddress, pickupTime, vehicleInfo, paymentMethod } = req.body;
    if (!['delivery', 'curbside'].includes(fulfillmentType)) {
      return res.status(400).json({ error: 'Choose delivery or curbside pickup.' });
    }
    const isDelivery = fulfillmentType === 'delivery';
    if (isDelivery && !deliveryAddress?.trim()) {
      return res.status(400).json({ error: 'Enter a delivery address.' });
    }
    if (!isDelivery && !pickupTime?.trim()) {
      return res.status(400).json({ error: 'Choose a pickup time.' });
    }

    // OrderFulfillment only has one text column
    const addressText = isDelivery
      ? deliveryAddress.trim().slice(0, 150)
      : (`Pickup: ${pickupTime.trim()}` +
         (vehicleInfo?.trim() ? ` | Vehicle: ${vehicleInfo.trim().slice(0, 60)}` : '')
        ).slice(0, 150);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const items = await getCartItems(conn, req.cart.id, true);
      if (items.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Your cart is empty.' });
      }
      const short = items.find(i => i.quantity > i.stock);
      if (short) {
        await conn.rollback();
        return res.status(400).json({ error: `Only ${short.stock} of "${short.name}" left in stock.` });
      }

      const [[delivery]] = await conn.query(
        'SELECT DeliveryID FROM DeliveryType WHERE DeliveryName LIKE ? ORDER BY DeliveryID LIMIT 1',
        [isDelivery ? '%deliver%' : '%curb%']
      );
      if (!delivery) {
        await conn.rollback();
        return res.status(500).json({
          error: 'DeliveryType needs a row with "Delivery" in its name and one with "Curb" in its name.'
        });
      }

      let employeeId = FULFILLMENT_EMPLOYEE_ID;
      if (!employeeId) {
        const [[emp]] = await conn.query('SELECT EmployeeID FROM Employee ORDER BY EmployeeID LIMIT 1');
        employeeId = emp?.EmployeeID;
      }
      if (!employeeId) {
        await conn.rollback();
        return res.status(500).json({ error: 'Add at least one Employee so orders can be assigned.' });
      }

      const t = calcTotals(items, fulfillmentType);

      const [sale] = await conn.query(
        `INSERT INTO Transactions
          (CustomerID, TransactionMethod, TotalPrice, TransactionDate, PointsEarned)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [req.customerId, isDelivery ? 'Pay on delivery' : 'Pay at pickup', t.total, t.points]
      );
      const orderId = sale.insertId;

      await conn.query(
        'INSERT INTO TransactionItems (TransactionID, InventoryID, Quantity, UnitPrice) VALUES ?',
        [items.map(i => [orderId, i.productId, i.quantity, i.price])]
      );

      await conn.query(
        `INSERT INTO OrderFulfillment
          (TransactionID, EmployeeID, DeliveryID, FulfillmentTime, ReadyStatus, DeliveryAddress)
         VALUES (?, ?, ?, NULL, 0, ?)`,
        [orderId, employeeId, delivery.DeliveryID, addressText]
      );

      for (const i of items) {
        await conn.query(
          'UPDATE Inventory SET StockQuantity = StockQuantity - ? WHERE InventoryID = ?',
          [i.quantity, i.productId]
        );
      }

      // Add points if this customer is in the loyalty program
      await conn.query(
        `UPDATE LoyaltyProgram
         SET CurrentPoints = CurrentPoints + ?, TotalPointsEarned = TotalPointsEarned + ?,
             LastActivityDate = NOW()
         WHERE CustomerID = ?`,
        [t.points, t.points, req.customerId]
      );

      await conn.query('DELETE FROM CartDetail WHERE CartID = ?', [req.cart.id]);

      await conn.commit();
      res.json({ orderId });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ error: 'Could not place your order. Please try again.' });
    } finally {
      conn.release();
    }
  }));

  // Order history 
  router.get('/orders', requireLogin, ah(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT t.TransactionID AS id, t.TotalPrice AS total,
              DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
              d.DeliveryName AS fulfillmentType, ${STATUS_SQL} AS status
       FROM Transactions t
       LEFT JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
       LEFT JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
       WHERE t.CustomerID = ?
       ORDER BY t.TransactionID DESC`,
      [req.customerId]
    );
    res.json(rows);
  }));

  // One order: receipt, items, returns 
  router.get('/orders/:orderId', requireLogin, ah(async (req, res) => {
    const [[order]] = await pool.query(
      `SELECT t.TransactionID AS id,
              DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
              t.TransactionMethod AS paymentMethod, t.TotalPrice AS total,
              t.PointsEarned AS points,
              (SELECT COALESCE(SUM(x.UnitPrice * x.Quantity), 0)
                 FROM TransactionItems x WHERE x.TransactionID = t.TransactionID) AS subtotal,
              c.FirstName AS firstName, c.LastName AS lastName, c.PhoneNumber AS phone,
              d.DeliveryName AS fulfillmentType, f.DeliveryAddress AS deliveryAddress,
              ${STATUS_SQL} AS status
       FROM Transactions t
       JOIN Customer c ON c.CustomerID = t.CustomerID
       LEFT JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
       LEFT JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
       WHERE t.TransactionID = ? AND t.CustomerID = ?`,
      [req.params.orderId, req.customerId]
    );
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const [items] = await pool.query(
      `SELECT ti.TransactionItemID AS id, i.InventoryName AS name,
              ti.Quantity AS quantity, ti.UnitPrice AS unitPrice,
              CAST(${returnedQtySql('ti.TransactionItemID')} AS SIGNED) AS returnedQty
       FROM TransactionItems ti
       JOIN Inventory i ON i.InventoryID = ti.InventoryID
       WHERE ti.TransactionID = ?`,
      [order.id]
    );
    const [returns] = await pool.query(
      `SELECT rr.ReturnRequestID AS id, rr.Quantity AS quantity, rr.ExpectedRefund AS refundTotal,
              rr.Reason AS reason, rr.Status AS status, i.InventoryName AS name
       FROM ReturnRequests rr
       JOIN TransactionItems ti ON ti.TransactionItemID = rr.TransactionItemID
       JOIN Inventory i ON i.InventoryID = ti.InventoryID
       WHERE ti.TransactionID = ?
       ORDER BY rr.ReturnRequestID DESC`,
      [order.id]
    );

    const feesAndTax = Math.max(
      0, Math.round((Number(order.total) - Number(order.subtotal)) * 100) / 100
    );
    res.json({ ...order, feesAndTax, items, returns, returnWindowDays: RETURN_WINDOW_DAYS });
  }));

  // Return requests 
  router.post('/orders/:orderId/returns', requireLogin, ah(async (req, res) => {
    const { transactionItemId, quantity, reason, details } = req.body;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || !reason) {
      return res.status(400).json({ error: 'Choose a quantity and a reason.' });
    }

    const [[order]] = await pool.query(
      `SELECT TransactionID AS id, DATEDIFF(CURDATE(), TransactionDate) AS ageDays
       FROM Transactions WHERE TransactionID = ? AND CustomerID = ?`,
      [req.params.orderId, req.customerId]
    );
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.ageDays > RETURN_WINDOW_DAYS) {
      return res.status(400).json({ error: `The ${RETURN_WINDOW_DAYS}-day return window has passed.` });
    }

    const [[item]] = await pool.query(
      `SELECT ti.TransactionItemID AS id, ti.Quantity AS quantity, ti.UnitPrice AS unitPrice,
              CAST(${returnedQtySql('ti.TransactionItemID')} AS SIGNED) AS returned
       FROM TransactionItems ti
       WHERE ti.TransactionItemID = ? AND ti.TransactionID = ?`,
      [transactionItemId, order.id]
    );
    if (!item) return res.status(404).json({ error: 'Item not found in this order.' });

    const left = item.quantity - Number(item.returned);
    if (qty > left) {
      return res.status(400).json({ error: `You can return at most ${left} of this item.` });
    }

    // Expected refund = item price x quantity
    const refund = Math.round(Number(item.unitPrice) * 100) * qty / 100;

    await pool.query(
      `INSERT INTO ReturnRequests (TransactionItemID, Quantity, Reason, Details, ExpectedRefund)
       VALUES (?, ?, ?, ?, ?)`,
      [item.id, qty, String(reason).slice(0, 50), details?.trim().slice(0, 500) || null, refund]
    );
    res.json({ ok: true });
  }));

  // Errors from these routes come back as JSON
  router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  });

  return router;
};
