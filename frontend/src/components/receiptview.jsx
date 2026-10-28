import { money, fmtDate } from '../api';

export default function ReceiptView({ o }) {
  const type = (o.fulfillmentType || '').toLowerCase();
  let where = <p><strong>In-store purchase</strong></p>;
  if (type.includes('curb')) {
    where = <p><strong>Curbside pickup:</strong> {o.deliveryAddress}</p>;
  } else if (type.includes('deliver')) {
    where = <p><strong>Delivery to:</strong> {o.deliveryAddress}</p>;
  }

  return (
    <>
      <h3>Order #{o.id}</h3>
      <p>{fmtDate(o.orderDate)} &middot; Status: <strong>{o.status}</strong></p>
      <p>{o.firstName} {o.lastName}{o.phone ? ` \u00b7 ${o.phone}` : ''}</p>
      {where}
      {o.items.map(i => (
        <div className="cart-row" key={i.id}>
          <span>{i.name} x {i.quantity}</span>
          <span>{money(i.unitPrice * i.quantity)}</span>
        </div>
      ))}
      <div className="cart-row"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
      <div className="cart-row"><span>Delivery fee &amp; tax</span><span>{money(o.feesAndTax)}</span></div>
      <div className="cart-row total"><span>Total</span><span>{money(o.total)}</span></div>
      <p>Payment: {o.paymentMethod}</p>
      {o.points > 0 && <p className="note">Points earned: {o.points}</p>}
    </>
  );
}
