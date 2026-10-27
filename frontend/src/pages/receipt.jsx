import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useShop } from '../ShopContext.jsx';
import ReceiptView from '../components/receiptview.jsx';

export default function Receipt() {
  const { orderId } = useParams();
  const { setCheckoutInfo, refreshCart } = useShop();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setCheckoutInfo(null);
    refreshCart().catch(console.error);
    api(`/api/orders/${orderId}`).then(setOrder).catch(err => setError(err.message));
  }, [orderId]);

  if (error) return <main className="page"><p className="error">{error}</p></main>;
  if (!order) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <main id="view-confirmation">
      <section className="panel">
        <h2>Thank you! Your order is confirmed.</h2>
        <p>Keep your order number. You will need it for returns and support.</p>
        <div className="receipt"><ReceiptView o={order} /></div>
        <button onClick={() => window.print()}>Print Receipt</button>
        <button className="secondary" onClick={() => navigate('/')}>Continue Shopping</button>
        <button className="secondary" onClick={() => navigate('/orders')}>View Order History</button>
      </section>
    </main>
  );
}
