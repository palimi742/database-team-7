import { useEffect, useRef, useState } from "react";
import { fmtDate, managerFetch } from "../../api.js";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import ReceiptView from "../../components/orders/receiptview.jsx";
import "../../css/orders/OrderDetails.css";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/CustomerLoyaltyReport.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function redeemedPoints(order) {
  return Number(order.PointsRedeemed) > 0 || Number(order.LoyaltyDiscount) > 0;
}

function formatSavings(order) {
  if (order.LoyaltyDiscount == null) {
    return "Not recorded";
  }
  return currency.format(order.LoyaltyDiscount);
}

function OrderReceipt({ orderId, onClose }) {
  const dialog = useRef(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    if (!dialog.current.open) dialog.current.showModal();

    async function loadReceipt() {
      try {
        const response = await managerFetch(
          `/api/reports/loyalty/orders/${orderId}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load the receipt.");
        if (!controller.signal.aborted) setOrder(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }

    void loadReceipt();
    return () => controller.abort();
  }, [orderId]);

  return (
    <dialog
      ref={dialog}
      className="loyalty-receipt"
      aria-labelledby="loyalty-receipt-title"
      onClose={onClose}
    >
      <div className="loyalty-receipt-heading">
        <h2 id="loyalty-receipt-title">Order receipt</h2>
        <form method="dialog">
          <button type="submit">Close</button>
        </form>
      </div>
      {error && <p role="alert">{error}</p>}
      {!order && !error && <p role="status">Loading receipt…</p>}
      {order && (
        <div className="order-details-card receipt">
          <ReceiptView order={order} readOnly />
        </div>
      )}
    </dialog>
  );
}

function LoyaltyResults({ orders }) {
  const [orderFilter, setOrderFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (orders.length === 0) {
    return <p role="status">No orders match these dates.</p>;
  }

  const redeemed = orders.filter(redeemedPoints);
  const notRedeemed = orders.filter((order) => !redeemedPoints(order));
  let visibleOrders = orders;
  if (orderFilter === "redeemed") visibleOrders = redeemed;
  if (orderFilter === "not-redeemed") visibleOrders = notRedeemed;
  const pageCount = Math.ceil(visibleOrders.length / ordersPerPage);
  const pageStart = (page - 1) * ordersPerPage;
  const pageOrders = visibleOrders.slice(pageStart, pageStart + ordersPerPage);

  function showOrders(filter) {
    setOrderFilter(filter);
    setPage(1);
  }

  function renderPagination(position) {
    return (
      <div className="loyalty-pagination">
        <p role={position === "Top" ? "status" : undefined}>
          Showing {pageStart + 1}–{pageStart + pageOrders.length} of{" "}
          {visibleOrders.length} orders
        </p>
        <label className="loyalty-page-size">
          Rows per page
          <select
            value={ordersPerPage}
            onChange={(event) => {
              setOrdersPerPage(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </label>
        {pageCount > 1 && (
          <nav aria-label={`${position} order pages`}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page === pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    );
  }

  return (
    <>
      <h2 id="loyalty-order-details">Orders</h2>
      <div
        className="loyalty-order-views"
        role="group"
        aria-label="Filter orders by points redemption"
      >
        <button
          type="button"
          aria-pressed={orderFilter === "all"}
          onClick={() => showOrders("all")}
        >
          All orders ({orders.length})
        </button>
        <button
          type="button"
          aria-pressed={orderFilter === "redeemed"}
          onClick={() => showOrders("redeemed")}
        >
          Points redeemed ({redeemed.length})
        </button>
        <button
          type="button"
          aria-pressed={orderFilter === "not-redeemed"}
          onClick={() => showOrders("not-redeemed")}
        >
          No points redeemed ({notRedeemed.length})
        </button>
      </div>
      {visibleOrders.length === 0 ? (
        <p role="status">No orders match this filter.</p>
      ) : (
        <>
          {renderPagination("Top")}
          <div className="loyalty-table">
            <table aria-labelledby="loyalty-order-details">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Fulfillment</th>
                  <th scope="col">Order total</th>
                  <th scope="col">Points redeemed</th>
                  <th scope="col">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {pageOrders.map((order) => (
                  <tr key={order.TransactionID}>
                    <td>
                      <strong>#{order.TransactionID}</strong>
                      <span className="loyalty-order-date">
                        {fmtDate(order.TransactionDate)}
                      </span>
                    </td>
                    <td>
                      {order.FirstName} {order.LastName}
                    </td>
                    <td>
                      <strong
                        className="loyalty-fulfillment"
                        data-fulfillment={order.fulfillmentType}
                      >
                        {order.fulfillmentType || "In-store"}
                      </strong>
                    </td>
                    <td>{currency.format(order.TotalPrice)}</td>
                    <td>
                      {redeemedPoints(order) ? (
                        <>
                          <strong>
                            {order.PointsRedeemed ?? "Not recorded"}
                          </strong>
                          <span className="loyalty-order-date">
                            Savings: {formatSavings(order)}
                          </span>
                        </>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="loyalty-view-order"
                        aria-label={`View order #${order.TransactionID}`}
                        onClick={() => setSelectedOrder(order.TransactionID)}
                      >
                        View order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination("Bottom")}
        </>
      )}
      {selectedOrder && (
        <OrderReceipt
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}

export default function CustomerLoyaltyReport() {
  const [dates, setDates] = useState({ from: "", through: "" });
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeDate(field, value) {
    setDates((current) => ({ ...current, [field]: value }));
    setOrders(null);
    setError("");
  }

  async function runReport(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrders(null);

    try {
      const response = await managerFetch(
        `/api/reports/loyalty/orders?${new URLSearchParams(dates)}`,
      );
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Unable to load the loyalty report.");
      }
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ManagerSidebar />
      <main className="manager-page customer-loyalty-report">
        <h1>Customer Loyalty Report</h1>
        <form className="loyalty-filters" onSubmit={runReport}>
          <label>
            Transaction from
            <input
              type="date"
              required
              disabled={loading}
              value={dates.from}
              max={dates.through || undefined}
              onChange={(event) => changeDate("from", event.target.value)}
            />
          </label>
          <label>
            Transaction through
            <input
              type="date"
              required
              disabled={loading}
              value={dates.through}
              min={dates.from || undefined}
              onChange={(event) => changeDate("through", event.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            Run report
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
        {loading && <p role="status">Loading loyalty report…</p>}
        {!loading && !error && !orders && (
          <p>Choose a transaction date range to run the report.</p>
        )}
        {orders && <LoyaltyResults orders={orders} />}
      </main>
    </div>
  );
}
