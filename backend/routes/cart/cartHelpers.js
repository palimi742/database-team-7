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

// Apply the best active clipped category coupon to each matching unit.
// Store the resulting unit price on the order so refunds use what was paid.
export async function applyClippedCoupons(db, customerId, items) {
  const [coupons] = await db.query(
    `SELECT uc.ClippedCouponID, c.CouponName, c.CategoryID, c.DiscountAmount
     FROM ClippedCoupons uc JOIN Coupons c ON c.CouponID = uc.CouponID
     WHERE uc.CustomerID = ?
       AND CURRENT_TIMESTAMP BETWEEN c.TimeStart AND c.TimeEnd
     ORDER BY c.DiscountAmount DESC, uc.ClippedCouponID`, [customerId],
  );
  const [products] = await db.query(
    `SELECT i.InventoryID, i.CategoryID FROM Inventory i
     WHERE i.InventoryID IN (?)`, [items.length ? items.map(item => item.productId) : [0]],
  );
  const categories = new Map(products.map(product => [Number(product.InventoryID), Number(product.CategoryID)]));
  return items.map(item => {
    const coupon = coupons.find(offer => Number(offer.CategoryID) === categories.get(Number(item.productId)));
    const originalPrice = Number(item.price);
    const price = coupon ? Math.max(0, Math.round((originalPrice - Number(coupon.DiscountAmount)) * 100) / 100) : originalPrice;
    return { ...item, originalPrice, price, lineTotal: Math.round(price * item.quantity * 100) / 100,
      couponName: price < originalPrice ? coupon.CouponName : null,
      customerCouponId: price < originalPrice ? coupon.ClippedCouponID : null };
  });
}
