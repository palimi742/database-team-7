import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, money, fmtDate } from "../../api";
import Navbar from "../../components/layout/Navbar";
import "../../css/orders/Orders.css";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] = useState("not-completed");

  useEffect(() => {
    api("/api/my-orders")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  const filteredOrders = (orders || []).filter((order) => {
    if (orderFilter === "completed") {
      return order.status === "Completed";
    }
    return order.status !== "Completed";
  });

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
        <div className="orders-heading">
          <h1>Past orders</h1>
          <div className="order-tabs">
            <button
              className={orderFilter === "not-completed" ? "active" : ""}
              onClick={() => setOrderFilter("not-completed")}
            >
              Not completed
            </button>
            <button
              className={orderFilter === "completed" ? "active" : ""}
              onClick={() => setOrderFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {error && <p className="orders-error">{error}</p>}

        {!orders && !error && (
          <p className="orders-message">Loading your orders...</p>
        )}

        {orders && !error && filteredOrders.length === 0 && (
          <p className="orders-message">No orders in this category</p>
        )}

        {filteredOrders.map((order) => (
          <div className="order-card" key={order.id}>
            <div>
              <h2>Order #{order.id}</h2>
              <p>{fmtDate(order.orderDate)}</p>
              <p>{order.fulfillmentType || "In-store"}</p>
              <span className="order-status">{order.status}</span>
            </div>

            <div className="order-card-actions">
              <strong>{money(order.total)}</strong>
              <button onClick={() => navigate(`/my-orders/${order.id}`)}>
                View order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
