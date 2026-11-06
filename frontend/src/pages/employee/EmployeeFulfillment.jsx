import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/employee/EmployeeFulfillment.css";

const API = "/api/employee/fulfillment";

export default function EmployeeFulfillment() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // The backend identifies the employee from their login cookie.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        setEmployee(null);
        setOrders([]);
        localStorage.removeItem("employee");
        navigate("/employee/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setEmployee(data.employee);
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
      setEmployee(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Automatically load orders when the page opens.
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateOrder(orderId, action) {
    setBusyOrder(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/orders/${orderId}/${action}`,
        {
          method: "PATCH",
          credentials: "same-origin",
        },
      );

      if (response.status === 401) {
        setEmployee(null);
        setOrders([]);
        localStorage.removeItem("employee");
        navigate("/employee/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update order.");
      }

      await loadOrders();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyOrder(null);
    }
  }

  const visibleOrders = orders.filter((order) => {
    if (filter === "All") return true;
    if (filter === "Completed") return order.status === "Completed";
    return order.status !== "Completed";
  });

  return (
    <div className="employee-page">
      <header className="employee-header">
        <h1>FreshMart Employee Dashboard</h1>
        <p>Manage your assigned deliveries and curbside pickups.</p>

        <Link to="/employee">Back to Employee Dashboard</Link>
      </header>

      <section className="employee-panel">
        <h2>My Orders</h2>

        {employee && (
          <p className="employee-welcome">
            Welcome, {employee.FirstName} {employee.LastName}
          </p>
        )}

        {loading && <p role="status">Loading your orders...</p>}

        {error && (
          <div role="alert">
            <p className="employee-error">{error}</p>
            <button onClick={loadOrders} disabled={loading}>
              Try Again
            </button>
          </div>
        )}

        {message && (
          <p className="employee-success" role="status">
            {message}
          </p>
        )}
      </section>

      {employee && (
        <section className="employee-panel">
          <div className="employee-toolbar">
            <h2>Assigned Orders</h2>

            <div>
              <select
                aria-label="Filter orders"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="All">All Orders</option>
              </select>

              <button
                onClick={loadOrders}
                disabled={loading || busyOrder !== null}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {!loading && visibleOrders.length === 0 && (
            <p>No orders found.</p>
          )}

          <div className="employee-order-grid">
            {visibleOrders.map((order) => (
              <article
                className="employee-order"
                key={order.FulfillmentID}
              >
                <div className="employee-order-top">
                  <div>
                    <h3>Order #{order.TransactionID}</h3>
                    <p>{order.DeliveryName}</p>
                  </div>

                  <span className="employee-status">
                    {order.status}
                  </span>
                </div>

                <p>
                  <strong>Customer:</strong>{" "}
                  {order.CustomerFirstName} {order.CustomerLastName}
                </p>

                {order.DeliveryName === "Home Delivery" && (
                  <p>
                    <strong>Delivery Address:</strong>{" "}
                    {order.DeliveryAddress || "Not provided"}
                  </p>
                )}

                <p>
                  <strong>Total:</strong>{" "}
                  ${Number(order.TotalPrice).toFixed(2)}
                </p>

                <div className="employee-items">
                  <h4>Order Items</h4>

                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.InventoryName} × {item.Quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                {order.status === "Assigned" && (
                  <button
                    disabled={loading || busyOrder !== null}
                    onClick={() =>
                      updateOrder(order.FulfillmentID, "ready")
                    }
                  >
                    {busyOrder === order.FulfillmentID
                      ? "Updating..."
                      : "Mark Ready"}
                  </button>
                )}

                {order.status === "Ready" && (
                  <button
                    disabled={loading || busyOrder !== null}
                    onClick={() =>
                      updateOrder(order.FulfillmentID, "complete")
                    }
                  >
                    {busyOrder === order.FulfillmentID
                      ? "Updating..."
                      : order.DeliveryName === "Home Delivery"
                        ? "Confirm Delivered"
                        : "Confirm Picked Up"}
                  </button>
                )}

                {order.status === "Completed" && (
                  <p className="employee-success">
                    Order Completed
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}