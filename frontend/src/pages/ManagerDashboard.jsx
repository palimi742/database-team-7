import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerDashboard.css";

function ManagerDashboard() {
  const orderStatus = ["Needs Assignment", "Assigned", "Completed"];
  const [statusFilter, setStatusFilter] = useState("Needs Assignment");
  const [employees, setEmployees] = useState([]);
  const [employeeError, setEmployeeError] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState("");

  // Load employees with no active assignment when the dashboard opens.
  async function loadEmployees() {
    setEmployeeError("");
    try {
      const res = await fetch("/api/employees/unassigned");
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
    setOrderError("");
    try {
      const res = await fetch("/api/manager/orders");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      const loadedOrders = data.map((order) => ({
        id: order.FulfillmentID,
        transactionID: order.TransactionID,
        type: order.DeliveryName,
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
    setOrders(
      orders.map((order) =>
        order.id === orderID ? { ...order, employeeID } : order,
      ),
    );
  }

  // Send the selected employee and fulfillment ID to the backend to save the assignment.
  async function assignOrder(orderID) {
    const selectedOrder = orders.find((order) => {
      return order.id === orderID;
    });
    if (selectedOrder === undefined) {
      return;
    }
    if (!selectedOrder.employeeID) {
      return;
    }

    try {
      const res = await fetch(`/api/manager/orders/${orderID}/assign`, {
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
    }
  }

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-main-dashboard">
        <h1>Manager Dashboard</h1>

        {employeeError && <p>{employeeError}</p>}
        {orderError && <p>{orderError}</p>}

        <div>
          {orderStatus.map((status) => (
            <button
              key={status}
              disabled={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <h2>{statusFilter}</h2>

        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Employee</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders
              .filter((order) => order.status === statusFilter)
              .map((order) => (
                <tr key={order.id}>
                  <td>#{order.transactionID}</td>
                  <td>{order.type}</td>
                  <td>
                    {order.status === "Needs Assignment" ? (
                      <select
                        value={order.employeeID}
                        onChange={(event) =>
                          selectEmployee(order.id, event.target.value)
                        }
                      >
                        <option value="">Select employee</option>

                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      order.employeeName
                    )}
                  </td>

                  <td>
                    {order.status === "Needs Assignment" && (
                      <button
                        disabled={!order.employeeID}
                        onClick={() => assignOrder(order.id)}
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {!orders.some((order) => order.status === statusFilter) && (
              <tr>
                <td colSpan={4}>No orders to display.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerDashboard;
