import { getCartItems } from "../routes/cart/cartHelpers.js";

// Read availability only after checkout has rolled back its stock deductions.
export async function handleDatabaseTriggerError(err, res, db, cartId) {
  if (err.code !== "ER_SIGNAL_EXCEPTION") return false;

  const items = await getCartItems(db, cartId);
  const stockIssues = items
    .filter(
      (item) =>
        !Number(item.isActive) || Number(item.quantity) > Number(item.stock),
    )
    .map((item) => ({
      productId: item.productId,
      name: item.name,
      requested: Number(item.quantity),
      available: Number(item.isActive) ? Math.max(0, Number(item.stock)) : 0,
    }));

  res.status(409).json({
    code: "STOCK_UNAVAILABLE",
    error: stockIssues.length
      ? "Some items no longer have enough stock. Update your quantities to continue."
      : "Availability changed while placing your order. Please review your cart and try again.",
    stockIssues,
  });
  return true;
}
