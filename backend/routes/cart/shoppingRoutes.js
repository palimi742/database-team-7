import { asyncHandler as ah, requireLogin } from "./cartMiddleware.js";

export function registerShoppingRoutes(router, pool) {
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

}
