import { activeCustomerId } from "../../auth/requireCustomer.js";

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function requireLogin(req, res, next) {
  if (!req.customerId) return res.status(401).json({ error: "Please log in." });
  next();
}

export function registerCartMiddleware(router, pool) {
  router.use(
    asyncHandler(async (req, res, next) => {
      req.customerId = await activeCustomerId(req, res, pool);
      res.set("Cache-Control", "no-store");
      next();
    }),
  );

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
}
