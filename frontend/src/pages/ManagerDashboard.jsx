import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerDashboard.css";

function ManagerDashboard() {
  const orderStatus = ["Needs Assignment", "Assigned", "Completed"];
  const [statusFilter, setStatusFilter] = useState("Needs Assignment");
  const [employees, setEmployees] = useState([]);
  const [employeeError, setEmployeeError] = useState("");
  const [orders, setOrders] = useState([]);
  //   const [orders, setOrders] = useState([])
  const [orderError, setOrderError] = useState("");

  //loads employees who don't have an order from the db
  useEffect(() => {
    async function loadEmployees() {
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
    loadEmployees();
  }, []);

  //load orders from db
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/manager/orders");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        setOrders(
          data.map((order) => ({
            id: order.FulfillmentID,
            transactionID: order.TransactionID,
            type: order.DeliveryName,
            employeeID:
              order.EmployeeID === null ? "" : String(order.EmployeeID),
            employeeName:
              order.EmployeeID === null
                ? "Unassigned"
                : `${order.FirstName} ${order.LastName}`,
            status: order.Status,
          })),
        );
      } catch (err) {
        setOrderError(err.message);
      }
    }
    loadOrders();
  }, []);

  function selectEmployee(orderID, employeeID) {
    setOrders(
      orders.map((order) =>
        order.id === orderID ? { ...order, employeeID } : order,
      ),
    );
  }

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
      console.log("received data", data)  
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
