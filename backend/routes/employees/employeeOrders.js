import { createHash } from "node:crypto";
import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";
import { applyClippedCoupons, calcTotals } from "../cart/cartHelpers.js";

const router = Router();
const businessDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Chicago" });
router.use(requireStaff, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

class OrderError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function respondError(error, res, next) {
  if (error instanceof OrderError) return res.status(error.status).json({ message: error.message });
  if (error.code === "ER_SIGNAL_EXCEPTION") {
    return res.status(409).json({ message: "Stock changed. Update the cart and try again." });
  }
  return next(error);
}

function readOrder(body) {
  const { customerId, fulfillmentType, deliveryAddress, items } = body ?? {};
  if (!Number.isSafeInteger(customerId) || customerId < 1) {
    throw new OrderError(400, "Select a customer.");
  }
  if (!["curbside", "delivery"].includes(fulfillmentType)) {
    throw new OrderError(400, "Choose curbside pickup or delivery.");
  }
  const address = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
  if (fulfillmentType === "delivery" && (!address || address.length > 150)) {
    throw new OrderError(400, "Enter a delivery address of up to 150 characters.");
  }
  if (!Array.isArray(items) || !items.length || items.length > 100) {
    throw new OrderError(400, "Add between 1 and 100 different products.");
  }

  const quantities = new Map();
  for (const item of items) {
    const { productId, quantity } = item ?? {};
    if (!Number.isSafeInteger(productId) || productId < 1 || quantities.has(productId) ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
      throw new OrderError(400, "Enter a valid whole-number quantity for each product.");
    }
    quantities.set(productId, quantity);
  }
  return { customerId, fulfillmentType, address: fulfillmentType === "delivery" ? address : null, quantities };
}

async function getQuote(db, order, lock = false) {
  const [[customer]] = await db.query(
    `SELECT CustomerID FROM Customer WHERE CustomerID = ? ${lock ? "FOR UPDATE" : ""}`,
    [order.customerId],
  );
  if (!customer) throw new OrderError(404, "Customer not found.");

  const [products] = await db.query(
    `SELECT InventoryID AS productId, InventoryName AS name, Price AS price, StockQuantity AS stock
     FROM Inventory WHERE IsActive = TRUE AND InventoryID IN (?)
     ORDER BY InventoryID ${lock ? "FOR UPDATE" : ""}`,
    [[...order.quantities.keys()]],
  );
  if (products.length !== order.quantities.size) {
    throw new OrderError(409, "A product is no longer available.");
  }
  const items = products.map((product) => {
    const quantity = order.quantities.get(product.productId);
    if (quantity > product.stock) {
      throw new OrderError(409, `${product.name} has only ${product.stock} available.`);
    }
    return { ...product, quantity };
  });
  const priced = await applyClippedCoupons(db, order.customerId, items);
  const totals = calcTotals(priced, order.fulfillmentType);
  if (totals.total > 99999999.99) throw new OrderError(400, "This order exceeds the maximum total.");
  const reviewKey = createHash("sha256").update(JSON.stringify([
    order.customerId, order.fulfillmentType, order.address,
    priced.map(({ productId, quantity, price }) => [productId, quantity, price]),
    totals.total,
  ])).digest("hex");
  return { items: priced, totals, reviewKey };
}

router.get("/customers", async (req, res, next) => {
  const search = String(req.query.q ?? "").trim();
  if (search.length < 2 || search.length > 100) return res.json({ customers: [] });
  const term = `%${search}%`;
  try {
    const [customers] = await pool.query(
      `SELECT CustomerID AS id, CONCAT(FirstName, ' ', LastName) AS name,
              RIGHT(PhoneNumber, 4) AS phoneEnd, CustomerAddress AS address
       FROM Customer WHERE CONCAT(FirstName, ' ', LastName) LIKE ? OR PhoneNumber LIKE ?
       ORDER BY FirstName, LastName, CustomerID LIMIT 15`,
      [term, term],
    );
    res.json({ customers });
  } catch (error) { next(error); }
});

router.get("/products", async (req, res, next) => {
  const search = String(req.query.q ?? "").trim();
  if (search.length > 100) return res.json({ products: [] });
  try {
    const [products] = await pool.query(
      `SELECT InventoryID AS id, InventoryName AS name, Price AS price, StockQuantity AS stock
       FROM Inventory WHERE IsActive = TRUE AND StockQuantity > 0
         AND (InventoryName LIKE ? OR SKU LIKE ?)
       ORDER BY InventoryName, InventoryID LIMIT 20`,
      [`%${search}%`, `%${search}%`],
    );
    res.json({ products });
  } catch (error) { next(error); }
});

router.post("/quote", async (req, res, next) => {
  try {
    res.json(await getQuote(pool, readOrder(req.body)));
  } catch (error) { respondError(error, res, next); }
});

router.get("/", async (req, res, next) => {
  const employeeId = req.employee.EmployeeID;
  try {
    const [[[today]], [recent], [assigned], [restocks]] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count FROM EmployeePlacedOrders p
         JOIN Transactions t ON t.TransactionID = p.TransactionID
         WHERE p.EmployeeID = ? AND t.TransactionDate = ?`,
        [employeeId, businessDay.format(new Date())],
      ),
      pool.query(
        `SELECT t.TransactionID AS orderId, t.TotalPrice AS total, d.DeliveryName AS method,
                CASE WHEN f.FulfillmentTime IS NOT NULL THEN 'Completed'
                     WHEN f.ReadyStatus = 1 THEN 'Ready'
                     WHEN f.EmployeeID IS NOT NULL THEN 'Assigned'
                     ELSE 'Needs assignment' END AS status
         FROM EmployeePlacedOrders p JOIN Transactions t ON t.TransactionID = p.TransactionID
         JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
         JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
         WHERE p.EmployeeID = ? ORDER BY p.TransactionID DESC LIMIT 5`,
        [employeeId],
      ),
      pool.query(
        `SELECT TransactionID AS orderId, ReadyStatus AS ready, d.DeliveryName AS method
         FROM OrderFulfillment f JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
         WHERE f.EmployeeID = ? AND f.FulfillmentTime IS NULL ORDER BY ReadyStatus DESC, f.FulfillmentID`,
        [employeeId],
      ),
      pool.query(
        `SELECT r.Status AS status, i.InventoryName AS name
         FROM RestockRequests r JOIN Inventory i ON i.InventoryID = r.InventoryID
         WHERE r.RequestedByEmployeeID = ? AND r.ReviewedAt IS NOT NULL
         ORDER BY GREATEST(r.ReviewedAt, COALESCE(r.FulfilledAt, r.ReviewedAt)) DESC, r.RequestID DESC LIMIT 1`,
        [employeeId],
      ),
    ]);
    res.json({ ordersToday: Number(today.count), recent, assigned, restockUpdate: restocks[0] ?? null });
  } catch (error) { next(error); }
});

async function findPlacedOrder(db, employeeId, requestKey) {
  const [[order]] = await db.query(
    `SELECT p.TransactionID AS orderId, t.TotalPrice AS total
     FROM EmployeePlacedOrders p JOIN Transactions t ON t.TransactionID = p.TransactionID
     WHERE p.EmployeeID = ? AND p.RequestKey = ?`,
    [employeeId, requestKey],
  );
  return order;
}

router.post("/", async (req, res, next) => {
  const employeeId = req.employee.EmployeeID;
  const { requestKey, reviewKey } = req.body ?? {};
  if (typeof requestKey !== "string" || !/^[a-f0-9-]{36}$/i.test(requestKey) ||
      typeof reviewKey !== "string" || !/^[a-f0-9]{64}$/.test(reviewKey)) {
    return res.status(400).json({ message: "Review the order before placing it." });
  }

  let conn;
  try {
    const previous = await findPlacedOrder(pool, employeeId, requestKey);
    if (previous) return res.json(previous);

    const order = readOrder(req.body);
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // Serialize retries from this employee before taking customer and stock locks.
    await conn.query("SELECT EmployeeID FROM Employee WHERE EmployeeID = ? FOR UPDATE", [employeeId]);
    const retry = await findPlacedOrder(conn, employeeId, requestKey);
    if (retry) {
      await conn.commit();
      return res.json(retry);
    }
    const quote = await getQuote(conn, order, true);
    if (quote.reviewKey !== reviewKey) {
      throw new OrderError(409, "Prices changed. Review the updated total before placing the order.");
    }
    const delivery = order.fulfillmentType === "delivery";
    const [[type]] = await conn.query(
      "SELECT DeliveryID FROM DeliveryType WHERE DeliveryName LIKE ? ORDER BY DeliveryID LIMIT 1",
      [delivery ? "%deliver%" : "%curb%"],
    );
    if (!type) throw new OrderError(409, "This fulfillment method has not been configured.");

    const { totals, items } = quote;
    const [sale] = await conn.query(
      `INSERT INTO Transactions
       (CustomerID, TransactionMethod, TotalPrice, TransactionDate, PointsEarned, DeliveryFee, LoyaltyDiscount, PointsRedeemed)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [order.customerId, delivery ? "Pay on delivery" : "Pay at pickup", totals.total,
        businessDay.format(new Date()), totals.points, totals.deliveryFee],
    );
    const orderId = sale.insertId;
    await conn.query(
      "INSERT INTO TransactionItems (TransactionID, InventoryID, Quantity, UnitPrice) VALUES ?",
      [items.map((item) => [orderId, item.productId, item.quantity, item.price])],
    );

    // TransactionItems uses the existing stock trigger. Verify its effect before committing.
    const [stocks] = await conn.query(
      "SELECT InventoryID, StockQuantity FROM Inventory WHERE InventoryID IN (?)",
      [[...order.quantities.keys()]],
    );
    const remaining = new Map(stocks.map((row) => [row.InventoryID, Number(row.StockQuantity)]));
    if (items.some((item) => remaining.get(item.productId) !== Number(item.stock) - item.quantity)) {
      throw new OrderError(503, "Stock was not updated. Check the database order stock trigger.");
    }

    await conn.query(
      `INSERT INTO OrderFulfillment
       (TransactionID, EmployeeID, DeliveryID, FulfillmentTime, ReadyStatus, DeliveryAddress)
       VALUES (?, NULL, ?, NULL, 0, ?)`,
      [orderId, type.DeliveryID, order.address],
    );
    await conn.query(
      `UPDATE LoyaltyProgram SET CurrentPoints = CurrentPoints + ?, TotalPointsEarned = TotalPointsEarned + ?,
              LastActivityDate = NOW() WHERE CustomerID = ?`,
      [totals.points, totals.points, order.customerId],
    );
    await conn.query(
      "INSERT INTO EmployeePlacedOrders (TransactionID, EmployeeID, RequestKey) VALUES (?, ?, ?)",
      [orderId, employeeId, requestKey],
    );
    await conn.commit();
    res.status(201).json({ orderId, total: totals.total });
  } catch (error) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackError) { console.error(rollbackError); }
    }
    respondError(error, res, next);
  } finally {
    conn?.release();
  }
});

export default router;