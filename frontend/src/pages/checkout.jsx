import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useShop } from '../ShopContext.jsx';
import OrderSummary from '../components/ordersummary.jsx';

const PICKUP_TIMES = [
  'ASAP (about 30 minutes)',
  'In about 1 hour',
  'In about 2 hours',
  'Tomorrow morning',
  'Tomorrow afternoon'
];

export default function Checkout() {
  const { cartId, profile, checkoutInfo, setCheckoutInfo } = useShop();
  const navigate = useNavigate();

  const [type, setType] = useState(checkoutInfo?.type || 'delivery');
  const [address, setAddress] = useState(checkoutInfo?.address ?? profile.address ?? '');
  const [pickupTime, setPickupTime] = useState(checkoutInfo?.pickupTime || '');
  const [vehicle, setVehicle] = useState(checkoutInfo?.vehicle || '');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  // The summary updates whenever delivery/curbside changes
  useEffect(() => {
    api(`/api/cart/${cartId}/summary?type=${type}`)
      .then(setSummary)
      .catch(err => setError(err.message));
  }, [cartId, type]);

  function submit(e) {
    e.preventDefault();
    setCheckoutInfo({ type, address, pickupTime, vehicle });
    navigate('/payment');
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
              <label>Vehicle make, color, or plate (helps us find you)
                <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} />
              </label>
            </>
          )}

          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={!summary || summary.items.length === 0}>
            Continue to Payment
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/cart')}>
            Back to cart
          </button>
        </form>
      </section>

      <OrderSummary summary={summary} />
    </main>
  );
}
