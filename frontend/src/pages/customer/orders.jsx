import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, money, fmtDate, returnStatus } from "../../api";
import Navbar from "../../components/layout/Navbar";
import "../../css/orders/Orders.css";

function HistoryPagination({ data, isReturns, position, onPage }) {
  return (
    <nav className="orders-pagination" aria-label={`${isReturns ? "Return request" : "Order"} pages ${position}`}>
      <button disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Previous</button>
      <span>Page {data.page} of {data.totalPages}</span>
      <button disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Next</button>
    </nav>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab");
  const tab = ["completed", "returns"].includes(selectedTab) ? selectedTab : "not-completed";
  const requestedPage = searchParams.get("page") || "1";
  const page = /^[1-9]\d*$/.test(requestedPage) && Number.isSafeInteger(Number(requestedPage))
    ? Number(requestedPage) : 1;
  const isReturns = tab === "returns";
  const selectedReturnStatus = searchParams.get("returnStatus");
  const returnFilter = ["approved", "rejected"].includes(selectedReturnStatus) ? selectedReturnStatus : "pending";
  const url = isReturns ? `/api/my-returns?status=${returnFilter}&page=${page}` : `/api/my-orders?status=${tab}&page=${page}`;
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const data = result?.url === url ? result.data : null;
  const errorMessage = error?.url === url ? error.message : "";

  useEffect(() => {
    let active = true;
    let loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const data = await api(url);
        if (active) {
          setResult({ url, data });
          setError(null);
        }
      } catch (err) {
        if (active) setError({ url, message: err.message });
      } finally {
        loading = false;
      }
    }
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 10000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [url]);

  function changeView(tab, page = 1) {
    setSearchParams({ tab, ...(tab === "returns" ? { returnStatus: returnFilter } : {}), page: String(page) });
  }

  function viewOrder(id) {
    navigate(`/my-orders/${id}`, { state: { historySearch: `?${searchParams.toString()}` } });
  }

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
        <div className="orders-heading">
          <h1>{isReturns ? "Return requests" : "My orders"}</h1>
          <div className="order-tabs" aria-label={isReturns ? "Return status" : "Order views"}>
            {(isReturns
              ? [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]]
              : [["not-completed", "Not completed"], ["completed", "Completed"]]).map(([value, label]) => (
              <button key={value} className={(isReturns ? returnFilter : tab) === value ? "active" : ""}
                aria-pressed={(isReturns ? returnFilter : tab) === value}
                onClick={() => isReturns
                  ? setSearchParams({ tab: "returns", returnStatus: value, page: "1" })
                  : changeView(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && <p role="alert" className="orders-error">{errorMessage}{data && " Showing the last loaded information."}</p>}
        {!data && !errorMessage && <p role="status" className="orders-message">{isReturns ? "Loading return requests…" : "Loading your orders…"}</p>}
        {data?.total === 0 && <p className="orders-message">{isReturns ? `You have no ${returnFilter} return requests.` : "No orders in this category."}</p>}
        {data?.total > 0 && (
          <div className="orders-list-header">
            <p className="orders-count" role="status">
              Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total} {isReturns ? "return requests" : "orders"}
            </p>
            <HistoryPagination data={data} isReturns={isReturns} position="top" onPage={(page) => changeView(tab, page)} />
          </div>
        )}

        {data?.items.map((entry) => {
          if (isReturns) {
            const status = returnStatus(entry.status);
            return (
              <article className="order-card return-request-card" key={entry.id}>
                <div>
                  <h2>{entry.name} × {entry.quantity}</h2>
                  <p>Return #{entry.id} | Order #{entry.orderId}</p>
                  <p>Requested {fmtDate(entry.requestedDate)}</p>
                  <p>Reason: {entry.reason}</p>
                  <span className={`return-status return-status-${status.tone}`}>{status.label}</span>
                  <p>{status.message}</p>
                </div>
                <div className="order-card-actions">
                  <button onClick={() => viewOrder(entry.orderId)}>View order</button>
                </div>
              </article>
            );
          }
          return (
            <article className="order-card" key={entry.id}>
              <div>
                <h2>Order #{entry.id}</h2>
                <p>{fmtDate(entry.orderDate)}</p>
                <p>{entry.fulfillmentType || "In-store"}</p>
                <span className="order-status">{entry.status}</span>
                <p>{Number(entry.returnRequestCount) > 0 ? `${entry.returnRequestCount} return request(s)` : "No return requests"}</p>
              </div>
              <div className="order-card-actions">
                <strong>{money(entry.total)}</strong>
                <button onClick={() => viewOrder(entry.id)}>View order</button>
              </div>
            </article>
          );
        })}

        {data?.total > 0 && (
          <HistoryPagination data={data} isReturns={isReturns} position="bottom" onPage={(page) => changeView(tab, page)} />
        )}
      </div>
    </div>
  );
}
