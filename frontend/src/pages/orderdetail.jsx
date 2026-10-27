import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api, money } from '../api';
import ReceiptView from '../components/receiptview.jsx';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const message = useLocation().state?.message;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/orders/${orderId}`).then(setOrder).catch(err => setError(err.message));
  }, [orderId]);

  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!order) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <main className="page">
      {message && <p className="success">{message}</p>}

      <div className="panel receipt"><ReceiptView o={order} /></div>

      <div className="panel">
        <h3>Returns</h3>
        <p className="note">
          Returns can be requested within {order.returnWindowDays} days of your order.
        </p>

        {order.items.map(i => {
          const left = i.quantity - i.returnedQty;
          return (
            <div className="cart-row" key={i.id}>
              <span>{i.name} (bought {i.quantity}, returned/requested {i.returnedQty})</span>
              {left > 0
                ? <button onClick={() => navigate(`/orders/${order.id}/return/${i.id}`)}>
                    Request Return
                  </button>
                : <span>-</span>}
            </div>
          );
        })}

        <h4>Your return requests</h4>
        {order.returns.length === 0 && <p>No return requests yet.</p>}
        {order.returns.map(r => (
          <div className="cart-row" key={r.id}>
            <span>
              {r.name} x {r.quantity} &mdash; {r.reason}<br />
              <span className="note">Expected refund {money(r.refundTotal)}</span>
            </span>
            <strong>{r.status}</strong>
          </div>
        ))}
      </div>

      <button className="secondary" onClick={() => navigate('/orders')}>
        Back to order history
      </button>
    </main>
  );
}
