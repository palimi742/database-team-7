import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrderIssueForm from "./OrderIssueForm";
import "../../css/employee/EmployeeFulfillment.css";
import "../../css/employee/EmployeeWorkspace.css";

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
  const loadOrders = useCallback(async (signal) => {
    if (!signal) {
      setLoading(true);
      setError("");
    }

    try {
      const response = await fetch(API, {
        credentials: "same-origin",
        cache: "no-store",
        signal,
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
      if (err.name !== "AbortError") {
        setError(err.message);
        setEmployee(null);
        setOrders([]);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [navigate]);

  // Automatically load orders when the page opens.
  useEffect(() => {
    const controller = new AbortController();
    loadOrders(controller.signal);
    return () => controller.abort();
  }, [loadOrders]);

  async function updateOrder(orderId, action, body, method = "PATCH") {
    setBusyOrder(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/orders/${orderId}/${action}`,
        {
          method,
          credentials: "same-origin",
          ...(body && {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
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
      return true;
    } catch (err) {
      setError(err.message);
      return false;
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
    <div className="employee-page fm-workspace">
      <header className="fm-hero">
        <Link className="fm-back" to="/employee">← Employee dashboard</Link>
        <p className="fm-eyebrow">Fulfillment</p>
        <h1>My Orders</h1>
        <p>Pack and manage your assigned deliveries and curbside pickups.</p>
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
            <button onClick={() => loadOrders()} disabled={loading}>
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
                onClick={() => loadOrders()}
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
            {visibleOrders.map((order) => {
              const packedCount = order.items.filter((item) => item.Packed).length;
              const packing = order.status === "Assigned";
              const disabled = loading || busyOrder !== null;
              return (
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

                  <div className="employee-items fm-packing">
                    <h4>{packing ? "Packing checklist" : "Order items"}</h4>
                    {packing && order.items.length > 0 && (
                      <>
                        <p className="fm-subtle">{packedCount} of {order.items.length} lines packed</p>
                        <progress aria-label="Order lines packed" value={packedCount} max={order.items.length} />
                      </>
                    )}
                    <ul className={packing ? "fm-checklist" : undefined}>
                      {order.items.map((item) => (
                        <li key={item.TransactionItemID}>
                          {packing ? (
                            <label>
                              <input type="checkbox" checked={Boolean(item.Packed)} disabled={disabled}
                                onChange={(event) => updateOrder(
                                  order.FulfillmentID, `items/${item.TransactionItemID}`, { packed: event.target.checked },
                                )} />
                              {item.InventoryName} × {item.Quantity}
                            </label>
                          ) : `${item.InventoryName} × ${item.Quantity}`}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {order.status === "Assigned" && (
                    <button
                      disabled={disabled || packedCount < order.items.length}
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
                  <OrderIssueForm order={order} disabled={disabled}
                    onSubmit={(body) => updateOrder(order.FulfillmentID, "issues", body, "POST")} />
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}