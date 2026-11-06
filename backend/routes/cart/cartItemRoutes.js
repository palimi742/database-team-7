import { asyncHandler as ah, requireLogin } from "./cartMiddleware.js";
import { getCartItems } from "./cartHelpers.js";

export function registerCartItemRoutes(router, pool) {
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
        `SELECT InventoryID FROM Inventory
         WHERE InventoryID = ? AND IsActive = TRUE`,
        [productId],
      );
      if (!product)
        return res.status(404).json({ error: "Product not found." });

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
        "SELECT InventoryID FROM Inventory WHERE InventoryID = ? AND IsActive = TRUE",
        [req.params.productId],
      );
      if (!product)
        return res.status(404).json({ error: "Product not found." });
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

}
