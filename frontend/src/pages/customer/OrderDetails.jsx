import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api";
import Navbar from "../../components/layout/Navbar";
import "../../css/orders/OrderDetails.css";
import ReceiptView from "../../components/orders/receiptview.jsx";

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const message = useLocation().state?.message;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/my-orders/${orderId}`)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [orderId]);

  return (
    <div className="order-details-page">
      <Navbar />
      <div className="order-details-container">
        <h1>Order details</h1>
        {error ? (
          <p className="order-details-error">{error}</p>
        ) : !order ? (
          <p>Loading order details...</p>
        ) : (
          <>
            {message && <p className="success">{message}</p>}

            <div className="order-details-card receipt">
              <ReceiptView order={order} />
            </div>
          </>
        )}
        <button className="secondary" onClick={() => navigate("/my-orders")}>
          Back to order history
        </button>
      </div>
    </div>
  );
}
