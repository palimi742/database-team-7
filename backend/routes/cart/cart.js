import express from "express";
import { registerCartMiddleware } from "./cartMiddleware.js";
import { registerShoppingRoutes } from "./shoppingRoutes.js";
import { registerCartItemRoutes } from "./cartItemRoutes.js";
import { registerCheckoutRoutes } from "./checkoutRoutes.js";
import { registerOrderRoutes } from "./orderRoutes.js";
import { registerReturnRoutes } from "./returnRoutes.js";

export default function (pool) {
  const router = express.Router();

  registerCartMiddleware(router, pool);
  registerShoppingRoutes(router, pool);
  registerCartItemRoutes(router, pool);
  registerCheckoutRoutes(router, pool);
  registerOrderRoutes(router, pool);
  registerReturnRoutes(router, pool);

  // Errors from these routes come back as JSON
  router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  });

  return router;
}
