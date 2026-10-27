import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, fmtDate } from '../api';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/orders').then(setOrders).catch(err => setError(err.message));
  }, []);

  return (
    <main id="view-history">
      <section className="panel">
        <h2>Order History</h2>
        {error && <p className="error">{error}</p>}
        {orders && orders.length === 0 && <p>You have no orders yet.</p>}
        {orders?.map(o => (
          <div className="cart-row" key={o.id}>
            <div>
              <strong>Order #{o.id}</strong><br />
              {fmtDate(o.orderDate)} &middot; {o.fulfillmentType || 'In-store'} &middot; {o.status}
            </div>
            <div>
              {money(o.total)}{' '}
              <button onClick={() => navigate(`/orders/${o.id}`)}>View</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
