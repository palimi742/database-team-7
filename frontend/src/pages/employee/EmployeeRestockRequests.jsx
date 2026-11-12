import DismissButton from "../../components/layout/DismissButton.jsx";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { employeeApi } from "./employeeApi";
import {
  ProductImage,
  CategoryFilters,
  useCategories,
  ShiftNotice,
  StockBadge,
} from "./EmployeeProductTools";
import "../../css/employee/EmployeeShiftHub.css";

export default function EmployeeRestockRequests() {
  const [params] = useSearchParams();
  const { categories, categoryError } = useCategories();
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventoryId, setInventoryId] = useState(
    params.get("inventoryId") || "",
  );
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestStatus, setRequestStatus] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const [inventory, history] = await Promise.all([
        employeeApi("inventory", { signal }),
        employeeApi("restock-requests", { signal }),
      ]);
      setProducts(
        inventory.items.filter(
          (item) => Number(item.StockQuantity) < Number(item.ReorderThreshold),
        ),
      );
      setRequests(history.requests);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const matches = (product, query) =>
    (!categoryId || String(product.CategoryID) === categoryId) &&
    `${product.InventoryName} ${product.SKU}`
      .toLowerCase()
      .includes(query.toLowerCase().trim());
  const visibleProducts = products.filter((item) => matches(item, search));
  const selected = visibleProducts.find(
    (item) => String(item.InventoryID) === inventoryId,
  );
  const quantity = selected
    ? Number(selected.ReorderThreshold) - Number(selected.StockQuantity)
    : 0;
  const visibleRequests = requests.filter(
    (item) =>
      matches(item, historySearch) &&
      (requestStatus === "All" || item.Status === requestStatus),
  );
  const pending =
    selected &&
    requests.some(
      (item) =>
        item.InventoryID === selected.InventoryID &&
        ["Pending", "Approved"].includes(item.Status),
    );
  const date = (value) => (value ? new Date(value).toLocaleString() : "—");
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selected || quantity <= 0) {
      setError("Select an eligible product.");
      return;
    }
    setSaving(true);
    try {
      const result = await employeeApi("restock-requests", {
        method: "POST",
        body: JSON.stringify({
          inventoryId: Number(inventoryId),
          note: note.trim(),
        }),
      });
      setNote("");
      setInventoryId("");
      await load();
      setMessage(
        `Request #${result.requestId} submitted for ${result.requestedQuantity} units.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="shift-hub">
      <div className="hub-shell">
        <Link className="hub-back" to="/employee">
          ← Employee Dashboard
        </Link>
        <section className="emp-report-hero">
          <span className="hub-eyebrow">FreshMart · Stock replenishment</span>
          <h1>Restock requests</h1>
          <p>
            Find products that need attention. Request stock and track the
            decision.
          </p>
        </section>
        <ShiftNotice />
        {error && (
          <p className="hub-error" role="alert">
            {error}
          </p>
        )}
        {categoryError && (
          <p className="hub-error" role="alert">
            Categories: {categoryError}
          </p>
        )}
        {message && (
          <p className="emp-success" role="status">
            {message} <DismissButton onClick={() => setMessage("")} />
          </p>
        )}
        <section className="hub-panel">
          <h2>Browse by category</h2>
          <CategoryFilters
            categories={categories}
            value={categoryId}
            disabled={saving || loading}
            onChange={(value) => {
              setCategoryId(value);
              setInventoryId("");
            }}
          />
          <p className="hub-muted">
            Category applies to the product selector and your request history.
          </p>
        </section>
        <div className="emp-restock-layout">
          <section className="hub-panel">
            <span className="hub-eyebrow">New request</span>
            <h2>Top up a product</h2>
            <p className="hub-muted">
              Quantity = reorder threshold − current stock. Stock changes when
              the approved delivery is received.
            </p>
            <form className="emp-restock-form" onSubmit={submit}>
              <label className="hub-field">
                Search eligible products
                <input
                  value={search}
                  maxLength={100}
                  disabled={saving || loading}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setInventoryId("");
                  }}
                  placeholder="Product name or SKU"
                />
              </label>
              <label className="hub-field">
                Product
                <select
                  required
                  value={selected ? inventoryId : ""}
                  disabled={saving || loading}
                  onChange={(event) => setInventoryId(event.target.value)}
                >
                  <option value="">Select a product</option>
                  {visibleProducts.map((item) => (
                    <option key={item.InventoryID} value={item.InventoryID}>
                      {item.InventoryName} · {item.StockQuantity} left
                    </option>
                  ))}
                </select>
              </label>
              {!loading && !visibleProducts.length && (
                <p>No eligible products match these filters.</p>
              )}
              {selected && (
                <div className="emp-selected-product">
                  <div className="emp-product-line">
                    <div>
                      <strong>{selected.InventoryName}</strong>
                      <small>
                        {selected.SKU} · {selected.CategoryName}
                      </small>
                    </div>
                    <ProductImage
                      id={selected.InventoryID}
                      url={selected.ImageURL}
                      name={selected.InventoryName}
                    />
                  </div>
                  <div className="emp-toolbar">
                    <StockBadge status={selected.StockStatus} />
                    <span>
                      {selected.StockQuantity} in stock · threshold{" "}
                      {selected.ReorderThreshold}
                    </span>
                  </div>
                </div>
              )}
              <label className="hub-field">
                Quantity to request
                <input
                  readOnly
                  value={selected ? quantity : ""}
                  placeholder="Select a product first"
                />
              </label>
              <label className="hub-field">
                Note (optional)
                <textarea
                  rows={3}
                  value={note}
                  maxLength={500}
                  disabled={saving || loading}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why is this stock needed?"
                />
              </label>
              {pending && (
                <p className="emp-help">
                  You already have a pending or approved request for this
                  product.
                </p>
              )}
              <button
                className="hub-button"
                disabled={saving || loading || !selected || pending}
              >
                {saving ? "Submitting…" : "Submit request →"}
              </button>
              <Link to="/employee/inventory">Open inventory report →</Link>
            </form>
          </section>
          <section className="hub-panel">
            <div className="emp-toolbar">
              <div>
                <span className="hub-eyebrow">Request history</span>
                <h2>My requests</h2>
              </div>
              <button
                className="hub-button hub-secondary"
                disabled={loading || saving}
                onClick={() => load()}
              >
                Refresh
              </button>
            </div>
            <div className="emp-history-filters">
              <label className="hub-field">
                Search requests
                <input
                  value={historySearch}
                  maxLength={100}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Product name or SKU"
                />
              </label>
              <label className="hub-field">
                Decision
                <select
                  value={requestStatus}
                  onChange={(event) => setRequestStatus(event.target.value)}
                >
                  {["All", "Pending", "Approved", "Rejected", "Fulfilled"].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            {loading && <p role="status">Loading requests…</p>}
            {!loading && !visibleRequests.length && (
              <p className="emp-empty">No requests match these filters.</p>
            )}
            <div className="emp-request-list">
              {visibleRequests.map((item) => (
                <article className="emp-request-card" key={item.RequestID}>
                  <div className="emp-product-line">
                    <div>
                      <strong>{item.InventoryName}</strong>
                      <small>
                        Request #{item.RequestID} · {item.CategoryName}
                      </small>
                    </div>
                    <ProductImage
                      id={item.InventoryID}
                      url={item.ImageURL}
                      name={item.InventoryName}
                    />
                  </div>
                  <div className="emp-toolbar">
                    <StockBadge status={item.Status} />
                    <strong>{item.RequestedQuantity} units requested</strong>
                  </div>
                  <p className="hub-muted">
                    Stock at request: {item.StockAtRequest} · Submitted{" "}
                    {date(item.CreatedAt)}
                  </p>
                  <details>
                    <summary>Notes and decision details</summary>
                    <p>Your note: {item.EmployeeNote || "—"}</p>
                    <p>Reviewed: {date(item.ReviewedAt)}</p>
                    <p>
                      Reviewed by:{" "}
                      {item.ManagerFirstName
                        ? `${item.ManagerFirstName} ${item.ManagerLastName}`
                        : "—"}
                    </p>
                    <p>Manager note: {item.ManagerNote || "—"}</p>
                    <p>Received: {date(item.FulfilledAt)}</p>
                  </details>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
