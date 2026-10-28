import { useState, useEffect } from 'react';
import { api, money, LOGIN_URL } from '../api';

const PICKUP_TIMES = [
  '10:00 am',
  '11:00 am',
  '12:00 pm',
  '1:00 pm',
  '2:00 pm',
  '3:00 pm',
  '4:00 pm',
  '5:00 pm',
  '6:00 pm',
  '7:00 pm',
  '8:00 pm',
  '9:00 pm',
  '10:00 pm',
  'Tomorrow morning 8:00-10:00 am',
  'Tomorrow afternoon 12:00-2:00 pm',
  'Tomorrow afternoon 2:00-4:00 pm',
  'Tomorrow afternoon 4:00-6:00 pm',
  'Tomorrow evening 6:00-8:00 pm'
];

export default function Checkout({ cartId, profile, goTo, onPlaced }) {
  const [type, setType] = useState('delivery');
  const [address, setAddress] = useState(profile?.address || '');
  const [pickupTime, setPickupTime] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // The summary updates whenever delivery/curbside changes
  useEffect(() => {
    api(`/api/cart/${cartId}/summary?type=${type}`)
      .then(setSummary)
      .catch(err => setError(err.message));
  }, [cartId, type]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api(`/api/cart/${cartId}/checkout`, 'POST', {
        fulfillmentType: type,
        deliveryAddress: address,
        pickupTime,
        vehicleInfo: vehicle
      });
      const t = calcTotals(items, fulfillmentType);

    // What gets saved in Transactions.TransactionMethod.
    const methodText = paymentMethod === 'online'
    ? 'Card online (DEMO)'
    : (isDelivery ? 'Pay on delivery' : 'Pay at pickup');
    
      await onPlaced(result.orderId);
    } catch (err) {
      if (err.status === 401) { window.location.href = LOGIN_URL; return; }
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main id="view-checkout">
      <section className="panel">
        <h2>Checkout</h2>
        <form onSubmit={submit}>
          <h3>Contact</h3>
          <p className="note">
            Order for {profile.firstName} {profile.lastName}
            {profile.phone ? ` \u00b7 ${profile.phone}` : ''}
          </p>

          <h3>How would you like your order?</h3>
          <div className="radio-row">
            <label>
              <input type="radio" name="fulfillment" checked={type === 'delivery'}
                     onChange={() => setType('delivery')} /> Delivery
            </label>
            <label>
              <input type="radio" name="fulfillment" checked={type === 'curbside'}
                     onChange={() => setType('curbside')} /> Curbside pickup
            </label>
          </div>

          {type === 'delivery' ? (
            <label>Delivery address
              <input type="text" value={address} required
                     onChange={e => setAddress(e.target.value)} />
            </label>
          ) : (
            <>
              <label>Pickup time
                <select value={pickupTime} required onChange={e => setPickupTime(e.target.value)}>
                  <option value="">Choose a time...</option>
                  {PICKUP_TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Car Description: Vehicle make, color, plate
                <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} />
              </label>
            </>
          )}

          <p className="note">Payment is collected when you receive your order.</p>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>Place Order</button>
          <button type="button" className="secondary" onClick={() => goTo('shop')}>
            Back to cart
          </button>
        </form>
      </section>

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
    </main>
  );
}
