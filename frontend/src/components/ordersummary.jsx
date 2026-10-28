import { money } from '../api';

export default function OrderSummary({ summary }) {
  return (
    <aside id="summary" className="panel">
      <h2>Order Summary</h2>
      {summary && (
        <>
          {summary.items.map(i => (
            <div className="cart-row" key={i.productId}>
              <span>{i.name} x {i.quantity}</span>
              <span>{money(i.lineTotal)}</span>
            </div>
          ))}
          <div className="cart-row"><span>Subtotal</span><span>{money(summary.subtotal)}</span></div>
          <div className="cart-row">
            <span>Delivery fee</span>
            <span>{summary.deliveryFee > 0 ? money(summary.deliveryFee) : 'Free'}</span>
          </div>
          <div className="cart-row"><span>Tax</span><span>{money(summary.tax)}</span></div>
          <div className="cart-row total"><span>Total</span><span>{money(summary.total)}</span></div>
          {summary.points > 0 && <p className="note">You will earn {summary.points} points.</p>}
          <p className="note">
            Delivery is free on orders of $50 or more. Curbside pickup is free.
          </p>
        </>
      )}
    </aside>
  );
}
