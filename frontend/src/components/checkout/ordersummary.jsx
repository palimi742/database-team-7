import "../../css/customer/QuantityInput.css";
import { money } from "../../api";

export default function OrderSummary({ summary, type, onQuantityChange, updating }) {
  return (
    <div id="summary" className="panel">
      <h2>Order Summary</h2>
      {summary && (
        <>
          {summary.items.map((i) => {
            const originalCents = Math.round(Number(i.originalPrice) * 100) * Number(i.quantity);
            const couponCents = originalCents - Math.round(Number(i.lineTotal) * 100);
            const hasDiscount = i.couponName && couponCents > 0;

            return (
              <div className="cart-row checkout-summary-item" key={i.productId}>
                <span>
                  {i.name} <span className="summary-quantity">x {onQuantityChange ? <input
                    key={`${i.productId}-${i.quantity}`}
                    aria-label={`Quantity for ${i.name}`} type="number" min="0" step="1"
                    className="quantity-input" defaultValue={i.quantity} disabled={updating}
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (event.target.value.trim() !== "" && Number.isSafeInteger(value) && value >= 0) {
                        if (value !== Number(i.quantity)) onQuantityChange(i.productId, value);
                      } else event.target.value = i.quantity;
                    }}
                    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  /> : i.quantity}</span>
                </span>
                <span>{money(hasDiscount ? originalCents / 100 : i.lineTotal)}</span>
                {hasDiscount && (
                  <>
                    <span className="coupon-applied">Coupon  {i.couponName}</span>
                    <span className="coupon-applied">-{money(couponCents / 100)}</span>
                    <strong className="checkout-discounted-price">After coupon</strong>
                    <strong className="checkout-discounted-price">{money(i.lineTotal)}</strong>
                  </>
                )}
              </div>
            );
          })}
          <div className="cart-row">
            <span>Subtotal</span>
            <span>{money(summary.subtotal)}</span>
          </div>
          {type === "delivery" && (
            <div className="cart-row">
              <span>Delivery fee</span>
              <span>
                {summary.deliveryFee > 0 ? money(summary.deliveryFee) : "Free"}
              </span>
            </div>
          )}
          {type === "delivery" && (
            <p className="note">
              Free delivery on orders of $50 or more. Delivery is $5.99 below $50.
            </p>
          )}
          {summary.loyaltyDiscount > 0 && (
            <div className="cart-row">
              <span>Loyalty savings</span>
              <span>-{money(summary.loyaltyDiscount)}</span>
            </div>
          )}
          <div className="cart-row total">
            <span>Total</span>
            <span>{money(summary.total)}</span>
          </div>
          {summary.points > 0 && (
            <p className="note">You will earn {summary.points} points.</p>
          )}
        </>
      )}
    </div>
  );
}
