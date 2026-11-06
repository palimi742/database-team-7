// Pricing and return policy
const TAX_RATE = 0; // taxes
const DELIVERY_FEE = 5.99;
const FREE_DELIVERY_OVER = 50; // free delivery at or above this subtotal
const POINTS_PER_DOLLAR = 1;
export const RETURN_WINDOW_DAYS = 14;

export function calcTotals(items, type) {
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

export async function getCartItems(db, cartId, forUpdate = false) {
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
