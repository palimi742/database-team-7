
import { useState } from "react";
import "../css/EmployeeFulfillment.css";

//const API = "http://localhost:3001/api/employee/fulfillment";
const API = "/api/employee/fulfillment";
// replaced

export default function EmployeeFulfillment() {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [busyOrder, setBusyOrder] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    if (!/^[1-9]\d*$/.test(employeeId)) {
      setError("Please enter a valid employee ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/${employeeId}`);
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
  }

  async function updateOrder(orderId, action) {
    setBusyOrder(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/${employeeId}/orders/${orderId}/${action}`,
        { method: "PATCH" }
      );

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

  const visibleOrders = orders.filter(order => {
    if (filter === "All") return true;

    if (filter === "Completed") {
      return order.status === "Completed";
    }

    return order.status !== "Completed";
  });

  return (
    <div className="employee-page">
      <header className="employee-header">
        <h1>FreshMart Employee Dashboard</h1>
        <p>Manage your assigned deliveries and curbside pickups.</p>
      </header>

      <section className="employee-panel">
        <h2>My Orders</h2>

        <form
          className="employee-search"
          onSubmit={event => {
            event.preventDefault();
            loadOrders();
          }}
        >
          <label htmlFor="employeeId">Employee ID</label>

          <input
            id="employeeId"
            type="number"
            min="1"
            value={employeeId}
            onChange={event => {
              setEmployeeId(event.target.value);
              setEmployee(null);
              setOrders([]);
              setError("");
              setMessage("");
}}
            //onChange={event => setEmployeeId(event.target.value)}
            placeholder="Enter your employee ID"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "View Orders"}
          </button>
        </form>

        {employee && (
          <p className="employee-welcome">
            Welcome, {employee.FirstName} {employee.LastName}
          </p>
        )}

        {error && <p className="employee-error">{error}</p>}
        {message && <p className="employee-success">{message}</p>}
      </section>

      {employee && (
        <section className="employee-panel">
          <div className="employee-toolbar">
            <h2>Assigned Orders</h2>

            <div>
              <select
                value={filter}
                onChange={event => setFilter(event.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="All">All Orders</option>
              </select>

              <button onClick={loadOrders} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {visibleOrders.length === 0 && (
            <p>No orders found.</p>
          )}

          <div className="employee-order-grid">
            {visibleOrders.map(order => (
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
                  {order.CustomerFirstName}{" "}
                  {order.CustomerLastName}
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
                    disabled={busyOrder === order.FulfillmentID}
                    onClick={() =>
                      updateOrder(order.FulfillmentID, "ready")
                    }
                  >
                    Mark Ready
                  </button>
                )}

                {order.status === "Ready" && (
                  <button
                    disabled={busyOrder === order.FulfillmentID}
                    onClick={() =>
                      updateOrder(order.FulfillmentID, "complete")
                    }
                  >
                    {order.DeliveryName === "Home Delivery"
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
