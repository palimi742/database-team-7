import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const REASONS = [
  'Spoiled or expired',
  'Damaged',
  'Wrong item received',
  'Not as described',
  'Changed my mind',
  'Other'
];

export default function ReturnRequest() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/orders/${orderId}`).then(setOrder).catch(err => setError(err.message));
  }, [orderId]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api(`/api/orders/${orderId}/returns`, 'POST', {
        transactionItemId: Number(itemId),
        quantity: qty,
        reason,
        details
      });
      navigate(`/orders/${orderId}`, { state: { message: 'Return request submitted.' } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (error && !order) return <main className="page"><p className="error">{error}</p></main>;
  if (!order) return <p style={{ padding: 24 }}>Loading...</p>;

  const item = order.items.find(i => String(i.id) === itemId);
  const left = item ? item.quantity - item.returnedQty : 0;

  if (!item || left < 1) {
    return (
      <main className="page">
        <div className="panel">
          <p>This item can't be returned.</p>
          <button onClick={() => navigate(`/orders/${orderId}`)}>Back to order</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="panel">
        <h2>Request a Return</h2>
        <p>Order #{order.id} &middot; <strong>{item.name}</strong></p>
        <p className="note">
          Returns can be requested within {order.returnWindowDays} days of your order.
        </p>

        <form onSubmit={submit}>
          <label>Quantity
            <select value={qty} onChange={e => setQty(Number(e.target.value))}>
              {Array.from({ length: left }, (_, i) => i + 1).map(n => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label>Reason
            <select value={reason} onChange={e => setReason(e.target.value)}>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label>Details (optional)
            <textarea rows="3" value={details} onChange={e => setDetails(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>Submit Return Request</button>
          <button type="button" className="secondary"
                  onClick={() => navigate(`/orders/${orderId}`)}>Cancel</button>
        </form>
      </div>
    </main>
  );
}
