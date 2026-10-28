import { useState, useEffect } from 'react';
import { api, money, fmtDate } from '../api';
import Receipt from './receipt.jsx';

const REASONS = [
  'Spoiled or expired',
  'Damaged',
  'Wrong item received',
  'Not as described',
  'Changed my mind',
  'Other'
];

function ReturnForm({ orderId, item, onDone }) {
  const left = item.quantity - item.returnedQty;
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api(`/api/orders/${orderId}/returns`, 'POST', {
        transactionItemId: item.id,
        quantity: qty,
        reason,
        details
      });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  //reason why returned
  return (
    <form onSubmit={submit}>
      <h4>Return: {item.name}</h4>
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
    </form>
  );
}

export default function History() {
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [returning, setReturning] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/orders').then(setOrders).catch(err => setError(err.message));
  }, []);

  async function openOrder(id, msg = '') {
    setError('');
    setReturning(null);
    setMessage(msg);
    try {
      setDetail(await api(`/api/orders/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main id="view-history">
      <section className="panel">
        <h2>Order History</h2>
        {error && <p className="error">{error}</p>}
        {orders.length === 0 && !error && <p>You have no orders yet.</p>}
        {orders.map(o => (
          <div className="cart-row" key={o.id}>
            <div>
              <strong>Order #{o.id}</strong><br />
              {fmtDate(o.orderDate)} &middot; {o.fulfillmentType || 'In-store'} &middot; {o.status}
            </div>
            <div>
              {money(o.total)} <button onClick={() => openOrder(o.id)}>View</button>
            </div>
          </div>
        ))}
      </section>

      <section id="order-detail">
        {detail && (
          <>
            {message && <p className="success">{message}</p>}
            <div className="panel receipt"><Receipt o={detail} /></div>

            <div className="panel">
              <h3>Returns</h3>
              <p className="note">
                Returns can be requested within {detail.returnWindowDays} days of your order.
              </p>

              {detail.items.map(i => {
                const left = i.quantity - i.returnedQty;
                return (
                  <div className="cart-row" key={i.id}>
                    <span>{i.name} (bought {i.quantity}, returned/requested {i.returnedQty})</span>
                    {left > 0
                      ? <button onClick={() => setReturning(i)}>Request Return</button>
                      : <span>-</span>}
                  </div>
                );
              })}

              {returning && (
                <ReturnForm
                  key={returning.id}
                  orderId={detail.id}
                  item={returning}
                  onDone={() => openOrder(detail.id, 'Return request submitted. We will process it immediately.')}
                />
              )}

              <h4>Your return requests</h4>
              {detail.returns.length === 0 && <p>No return requests yet.</p>}
              {detail.returns.map(r => (
                <div className="cart-row" key={r.id}>
                  <span>
                    {r.name} x {r.quantity} &mdash; {r.reason}<br />
                    <span className="note">Expected refund {money(r.refundTotal)}</span>
                  </span>
                  <strong>{r.status}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
