import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi, money } from "./employeeApi";
import { ProductImage, StockBadge } from "./EmployeeProductTools";
import "../../css/employee/EmployeeShiftHub.css";

export default function EmployeeRecentOrders() {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setResult(null);
    employeeApi(`orders/recent?page=${page}`, { signal: controller.signal })
      .then(setResult).catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, reload]);
  return <main className="shift-hub"><div className="hub-shell">
    <Link className="hub-back" to="/employee">← Employee Dashboard</Link>
    <section className="emp-report-hero"><span className="hub-eyebrow">Your checkout history</span>
      <h1>Recent customer orders</h1><p>Orders you placed for customers. Open an order to review its products.</p></section>
    <div className="emp-toolbar"><p>Page {page}</p><button className="hub-button hub-secondary" disabled={loading}
      onClick={() => setReload((value) => value + 1)}>Refresh</button></div>
    {error && <p className="hub-error" role="alert">{error}</p>}
    {loading && <p role="status">Loading recent orders…</p>}
    {result?.orders.length === 0 && <section className="hub-panel emp-empty">No orders on this page. Customer orders you place will appear here.</section>}
    {result?.orders.map((order) => <details className="hub-panel emp-history" key={order.orderId}>
      <summary><span><strong>Order #{order.orderId}</strong><small>{order.customer} · {order.method}</small></span>
        <StockBadge status={order.status} /><strong>{money.format(order.total)}</strong></summary>
      <p className="hub-muted">Order date: {String(order.date).slice(0, 10)}</p>
      <ul className="hub-list">{order.items.map((item) => <li key={item.TransactionItemID}>
        <div className="emp-product-line"><div><strong>{item.InventoryName}</strong><br />
          <small>{item.Quantity} × {money.format(item.UnitPrice)}</small></div>
          <ProductImage id={item.InventoryID} url={item.ImageURL} name={item.InventoryName} /></div>
      </li>)}</ul></details>)}
    <nav className="emp-toolbar" aria-label="Order history pages">
      <button className="hub-button hub-secondary" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      <button className="hub-button hub-secondary" disabled={loading || !result?.hasMore} onClick={() => setPage(page + 1)}>Next</button>
    </nav>
  </div></main>;
}