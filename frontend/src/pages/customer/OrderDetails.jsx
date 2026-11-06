import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api, returnStatus } from "../../api";
import Navbar from "../../components/layout/Navbar";
import "../../css/orders/OrderDetails.css";
import "../../css/orders/Orders.css";
import ReceiptView from "../../components/orders/receiptview.jsx";

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const message = state?.message;
  const historySearch = state?.historySearch || "";
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let loading = false;
    async function loadOrder() {
      if (loading) return;
      loading = true;
      try {
        const nextOrder = await api(`/api/my-orders/${orderId}`);
        if (active) {
          setOrder(nextOrder);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        loading = false;
      }
    }
    void loadOrder();
    const timer = setInterval(() => {
      if (!document.hidden) void loadOrder();
    }, 10000);
    window.addEventListener("focus", loadOrder);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", loadOrder);
    };
  }, [orderId]);

  const currentOrder = order && String(order.id) === String(orderId) ? order : null;

  return (
    <div className="order-details-page">
      <Navbar />
      <div className="order-details-container">
        <h1>Order details</h1>
        {error && <p role="alert" className="order-details-error">{error}</p>}
        {!currentOrder ? (
          !error && <p>Loading order details...</p>
        ) : (
          <>
            {message && <p role="status" className="success">{message}</p>}

            <div className="order-details-card receipt">
              <ReceiptView order={currentOrder} />
            </div>
            <section className="order-details-card" aria-labelledby="return-requests-title">
              <div className="return-requests-heading">
                <h2 id="return-requests-title">Your return requests</h2>
                <button className="secondary" onClick={() => navigate("/my-orders?tab=returns&page=1")}>View all returns</button>
              </div>
              {currentOrder.returns?.length ? currentOrder.returns.map((request) => {
                const status = returnStatus(request.status);
                return (
                  <article className="return-request-detail" key={request.id}>
                    <div className="return-request-heading">
                      <h3>{request.name} × {request.quantity}</h3>
                      <span className={`return-status return-status-${status.tone}`}>{status.label}</span>
                    </div>
                    <p>Return #{request.id} · {request.reason}</p>
                    <p>{status.message}</p>
                  </article>
                );
              }) : <p>No return requests for this order.</p>}
            </section>
          </>
        )}
        <button className="secondary" onClick={() => navigate(`/my-orders${historySearch}`)}>
          Back to order history
        </button>
      </div>
    </div>
  );
}
