import { managerFetch } from "../../api.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";

function ManagerDashboard() {
  const orderStatus = ["Needs Assignment", "Assigned", "Completed"];
  const [statusFilter, setStatusFilter] = useState("Needs Assignment");
  const [typeFilter, setTypeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [employees, setEmployees] = useState([]);
  const [employeeError, setEmployeeError] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [assigningOrder, setAssigningOrder] = useState(null);
  // Load employees with no active assignment when the dashboard opens.
  async function loadEmployees() {
    setEmployeeError("");
    try {
      const res = await managerFetch("/api/employees/unassigned");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setEmployees(
        data.map((employee) => ({
          id: String(employee.EmployeeID),
          name: `${employee.FirstName} ${employee.LastName}`,
        })),
      );
    } catch (err) {
      setEmployeeError(err.message);
    }
  }

  // Load orders and prepare their details for the table.
  async function loadOrders() {
    try {
      const res = await managerFetch("/api/manager/orders");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      const loadedOrders = data.map((order) => ({
        id: order.FulfillmentID,
        transactionID: order.TransactionID,
        type: order.DeliveryName,
        fulfillmentType: /curbside/i.test(order.DeliveryName)
          ? "Curbside Pickup"
          : /delivery/i.test(order.DeliveryName) ? "Delivery" : null,
        customerID: order.CustomerID,
        customerName: [order.CustomerFirstName, order.CustomerLastName]
          .filter(Boolean).join(" "),
        deliveryAddress: order.DeliveryAddress,
        employeeID: order.EmployeeID === null ? "" : String(order.EmployeeID),
        employeeName:
          order.EmployeeID === null
            ? "Unassigned"
            : `${order.FirstName} ${order.LastName}`,
        status: order.Status,
      }));

      // Keep an unsaved employee selection when the database order still needs assignment.
      // loadedOrders is the full list; loadedOrder is one order from that list.
      // To prevent our current selection from resetting on the fresh that happens
      setOrders((currentOrders) => {
        return loadedOrders.map((loadedOrder) => {
          const currentOrder = currentOrders.find((order) => {
            return order.id === loadedOrder.id;
          });

          if (
            currentOrder !== undefined &&
            currentOrder.status === "Needs Assignment" &&
            loadedOrder.status === "Needs Assignment" &&
            loadedOrder.employeeID === ""
          ) {
            return { ...loadedOrder, employeeID: currentOrder.employeeID };
          }
          return loadedOrder;
        });
      });
    } catch (err) {
      setOrderError(err.message);
    }
  }

  useEffect(() => {
    loadEmployees();
    loadOrders();

    // Refresh orders and employees every 5 seconds without reloading the page.
    const refreshTimer = setInterval(() => {
      loadEmployees();
      loadOrders();
    }, 5000);
    return () => {
      clearInterval(refreshTimer);
    };
  }, []);

  // Remember the dropdown selection in React until Assign is clicked.
  function selectEmployee(orderID, employeeID) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderID ? { ...order, employeeID } : order,
      ),
    );
  }

  // Send the selected employee and fulfillment ID to the backend to save the assignment.
  async function assignOrder(orderID) {
    if (assigningOrder !== null) return;
    const selectedOrder = orders.find((order) => {
      return order.id === orderID;
    });
    if (selectedOrder === undefined) {
      return;
    }
    if (!selectedOrder.employeeID) {
      return;
    }

    setOrderError("");
    setAssigningOrder(orderID);
    try {
      const res = await managerFetch(`/api/manager/orders/${orderID}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeID: selectedOrder.employeeID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      //updates the list
      await loadOrders();
      await loadEmployees();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setAssigningOrder(null);
    }
  }

  const filteredOrders = orders.filter((order) =>
    order.status === statusFilter &&
    (typeFilter === "All" || order.fulfillmentType === typeFilter),
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-page order-dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Manager Dashboard</h1>
            <p>Track orders and assign work to your team.</p>
          </div>
          <div className="dashboard-actions">
            <Link to="/manager/restock-requests">Manage restock requests</Link>
            <Link to="/manager/order-issues">Review order issues</Link>
          </div>
        </header>

        {employeeError && <p>{employeeError}</p>}
        {orderError && <p role="alert">{orderError}</p>}

        <div className="order-filters" aria-label="Order status" role="group">
          {orderStatus.map((status) => (
            <button
              key={status}
              data-status={status}
              aria-pressed={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status === "Needs Assignment" ? "Unassigned" : status}
            </button>
          ))}
        </div>
        <h2>{statusFilter === "Needs Assignment" ? "Unassigned" : statusFilter}</h2>
        <div className="order-filters fulfillment-filters" aria-label="Fulfillment type" role="group">
          {["All", "Curbside Pickup", "Delivery"].map((type) => (
            <button
              key={type}
              type="button"
              data-fulfillment={type}
              aria-pressed={typeFilter === type}
              onClick={() => {
                setTypeFilter(type);
                setPage(1);
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Delivery address</th>
              <th>Employee</th>
              {statusFilter === "Needs Assignment" && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.transactionID}</td>
                  <td>
                    {order.customerName
                      ? `${order.customerName} (Customer ID: ${order.customerID})`
                      : "Unavailable"}
                  </td>
                  <td>
                    <span className="fulfillment-label" data-fulfillment={order.fulfillmentType}>
                      {order.type}
                    </span>
                  </td>
                  <td>
                    {order.fulfillmentType === "Delivery"
                      ? order.deliveryAddress?.trim() || "Address unavailable"
                      : "N/A"}
                  </td>
                  <td>
                    {order.status === "Needs Assignment" ? (
                      <select
                        aria-label={`Employee for order #${order.transactionID}`}
                        disabled={assigningOrder !== null}
                        value={order.employeeID}
                        onChange={(event) =>
                          selectEmployee(order.id, event.target.value)
                        }
                      >
                        <option value="">Select employee</option>

                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} (Employee ID: {employee.id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      order.employeeID
                        ? `${order.employeeName} (Employee ID: ${order.employeeID})`
                        : order.employeeName
                    )}
                  </td>

                  {statusFilter === "Needs Assignment" && (
                    <td>
                      <button
                        disabled={assigningOrder !== null || !order.employeeID}
                        onClick={() => assignOrder(order.id)}
                      >
                        {assigningOrder === order.id ? "Assigning…" : "Assign"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}

            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={statusFilter === "Needs Assignment" ? 6 : 5}>No orders to display.</td>
              </tr>
            )}
          </tbody>
        </table>

        <nav className="order-pagination" aria-label="Order pages">
          <label>
            Orders per page{" "}
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <span aria-live="polite">
            {filteredOrders.length === 0
              ? "0 orders"
              : `Showing ${startIndex + 1}–${startIndex + visibleOrders.length} of ${filteredOrders.length}`}
          </span>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}

export default ManagerDashboard;
