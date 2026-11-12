import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi, money } from "./employeeApi";
import { ProductImage, CategoryFilters, StockBadge, useCategories } from "./EmployeeProductTools";
import "../../css/employee/EmployeeShiftHub.css";

function SourceRecord({ snapshot, onClose }) {
  const dialog = useRef(null);
  const [source, setSource] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current.showModal();
    const controller = new AbortController();
    employeeApi(`inventory/${snapshot.InventoryID}/source`, { signal: controller.signal })
      .then(setSource).catch((err) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [snapshot.InventoryID]);
  const fields = [["SKU", "SKU"], ["InventoryName", "Product"], ["CategoryName", "Category"],
    ["StockQuantity", "Stock quantity"], ["ReorderThreshold", "Reorder threshold"], ["StockStatus", "Stock status"]];
  return <dialog ref={dialog} className="emp-source-dialog" onCancel={onClose} onClose={onClose}
    aria-labelledby="source-title">
    <div className="emp-toolbar"><h2 id="source-title">Source record #{snapshot.InventoryID}</h2>
      <button className="hub-button hub-secondary" onClick={onClose} autoFocus>Close</button></div>
    <p>Report: <strong>employee_inventory_stock_report</strong> view.</p>
    <p>Original records: <strong>Inventory.InventoryID = {snapshot.InventoryID}</strong> and <strong>Category.CategoryID = {snapshot.CategoryID}</strong>.</p>
    <p className="hub-muted">The report is a snapshot. Current values are read again from the database when you open this panel.</p>
    {error && <p className="hub-error" role="alert">{error}</p>}
    {!source && !error && <p role="status">Reading database record…</p>}
    {source && <>
      <p>Checked {new Date(source.fetchedAt).toLocaleString()}. Product is {Number(source.record.IsActive) ? "active" : "archived"}.</p>
      <div className="emp-table-wrap"><table className="emp-table"><thead><tr><th>Field</th><th>Report value</th><th>Current database value</th></tr></thead>
        <tbody>{fields.map(([key, label]) => <tr key={key} className={String(snapshot[key]) !== String(source.record[key]) ? "emp-changed" : ""}>
          <th scope="row">{label}</th><td>{snapshot[key]}</td><td>{source.record[key]}</td></tr>)}</tbody></table></div>
      <p className="hub-muted">Highlighted rows have changed. Generate the report again to update it.</p>
      <p>Current price: {money.format(source.record.Price)} · Last record update: {new Date(source.record.TableUpdateTime).toLocaleString()}</p>
    </>}
  </dialog>;
}

export default function EmployeeInventoryReport() {
  const { categories, categoryError } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("All");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const draft = { search: search.trim(), status, categoryId: categoryId ? Number(categoryId) : null };
  const changed = report && JSON.stringify(report.filters) !== JSON.stringify(draft);

  async function generate(event) {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(""); setSelected(null);
    try {
      setReport(await employeeApi("inventory?" + new URLSearchParams({ search: draft.search, status, categoryId }), { signal: controller.signal }));
    } catch (err) { if (err.name !== "AbortError") setError(err.message); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const cards = report ? [["Products in report", report.summary.TotalProducts, "all"],
    ["Out of stock", report.summary.OutOfStock, "red"], ["Low stock", report.summary.LowStock, "amber"],
    ["Normal stock", report.summary.NormalStock, "green"], ["High stock", report.summary.HighStock, "blue"]] : [];
  return <main className="shift-hub"><div className="hub-shell emp-report-shell">
    <Link className="hub-back" to="/employee">← Employee Dashboard</Link>
    <section className="emp-report-hero"><div><span className="hub-eyebrow">FreshMart · Inventory intelligence</span>
      <h1>Inventory stock report</h1><p>Choose your parameters. Generate a snapshot. Review the source.</p></div>
      <span className="emp-hero-mark" aria-hidden="true">▦</span></section>
    <form className="hub-panel emp-filter-panel" onSubmit={generate}>
      <div className="emp-toolbar"><div><span className="hub-eyebrow">01 · Report parameters</span><h2>What would you like to review?</h2></div>
        <span className="emp-tag">Generated on demand</span></div>
      <div className="emp-report-fields"><label className="hub-field">Search products<input value={search} maxLength={100}
        placeholder="Product name or SKU" disabled={loading} onChange={(event) => setSearch(event.target.value)} /></label>
        <label className="hub-field">Stock status<select value={status} disabled={loading} onChange={(event) => setStatus(event.target.value)}>
          {["All", "Out of stock", "Low", "Normal", "High"].map((value) => <option key={value}>{value}</option>)}
        </select></label><button className="hub-button" disabled={loading}>{loading ? "Generating…" : "Generate report →"}</button></div>
      <CategoryFilters categories={categories} value={categoryId} onChange={setCategoryId} disabled={loading} />
      {categoryError && <p className="hub-error" role="alert">Categories: {categoryError}</p>}
      <details className="emp-rule"><summary>How stock levels are calculated</summary>
        <p>Out of stock: 0. Low: below that product’s reorder threshold. High: at least 75, after excluding low stock. Otherwise Normal. Only active products are included.</p></details>
    </form>
    {error && <p className="hub-error" role="alert">{error}{report ? " The previous report remains below." : ""}</p>}
    {!report && !loading && <section className="hub-panel emp-empty"><span className="emp-empty-icon" aria-hidden="true">▦</span>
      <h2>Your report starts here</h2><p>Select categories and stock levels above, then press Generate report.</p></section>}
    {loading && <p role="status">Reading inventory records…</p>}
    {report && <>
      <div className="emp-toolbar"><div><span className="hub-eyebrow">02 · Report results</span><h2>{report.items.length} products found</h2>
        <p className="hub-muted">Generated {new Date(report.generatedAt).toLocaleString()}</p></div>
        <span className="emp-tag">{categories.find((category) => category.CategoryID === report.filters.categoryId)?.CategoryName || "All categories"} · {report.filters.status}</span></div>
      {changed && <p className="emp-shift-notice" role="status">Parameters changed. Press Generate report to apply them. Results below use the previous parameters.</p>}
      <section className="emp-metric-grid" aria-label="Filtered inventory summary">{cards.map(([label, count, color]) => <article key={label} className={`emp-metric emp-${color}`}>
        <span>{label}</span><strong>{count}</strong></article>)}</section>
      <section className="hub-panel emp-results"><div className="emp-toolbar"><h2>Stock overview</h2><span className="hub-muted">Click a source record to verify its data</span></div>
        <div className="emp-table-wrap"><table className="emp-table"><thead><tr><th>Product</th><th>Category</th><th>Available</th><th>Reorder at</th><th>Status</th><th>Source / action</th></tr></thead>
          <tbody>{report.items.map((item) => <tr key={item.InventoryID}>
            <td><div className="emp-product-line"><div><strong>{item.InventoryName}</strong><small>{item.SKU}</small></div>
              <ProductImage id={item.InventoryID} url={item.ImageURL} name={item.InventoryName} /></div></td>
            <td>{item.CategoryName}</td><td className="emp-number">{item.StockQuantity}</td><td>{item.ReorderThreshold}</td>
            <td><StockBadge status={item.StockStatus} /></td><td><button type="button" className="emp-source-link" onClick={() => setSelected(item)}>Inventory #{item.InventoryID} ↗</button>
              {Number(item.StockQuantity) < Number(item.ReorderThreshold) && <Link className="emp-restock-link" to={`/employee/restock-requests?inventoryId=${item.InventoryID}`}>Request restock →</Link>}</td>
          </tr>)}</tbody></table></div>
        {!report.items.length && <div className="emp-empty">No products match these parameters. Try another category or stock status.</div>}
        <footer className="emp-provenance"><strong>Source:</strong> {report.source.view} · joined to {report.source.tables.join(" + ")}.
          <br />Counts reflect this report’s filters. Source panels show the current records when opened.</footer>
      </section>
    </>}
    {selected && <SourceRecord key={selected.InventoryID} snapshot={selected} onClose={() => setSelected(null)} />}
  </div></main>;
}