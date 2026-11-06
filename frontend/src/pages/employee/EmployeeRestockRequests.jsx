import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../../css/employee/EmployeeFulfillment.css";

const API = "/api/employee/restock-requests";

export default function EmployeeRestockRequests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventoryId, setInventoryId] = useState(
    searchParams.get("inventoryId") || "",
  );
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch("/api/reports/inventory/stock", {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        }),
        fetch(API, {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        }),
      ]);

      if (responses.some((response) => response.status === 401)) {
        setProducts([]);
        setRequests([]);
        localStorage.removeItem("employee");
        navigate("/employee/login", { replace: true });
        return;
      }

      const [inventoryData, requestData] = await Promise.all(
        responses.map((response) => response.json()),
      );

      if (!responses[0].ok) {
        throw new Error(
          inventoryData.message || "Unable to load products.",
        );
      }

      if (!responses[1].ok) {
        throw new Error(
          requestData.message || "Unable to load your requests.",
        );
      }

      setProducts(
        inventoryData.items.filter(
          (item) => Number(item.StockQuantity) <= 20,
        ),
      );
      setRequests(requestData.requests);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
        setProducts([]);
        setRequests([]);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => controller.abort();
  }, [loadData]);

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const productId = Number(inventoryId);
    const requestedQuantity = Number(quantity);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity <= 0 ||
      requestedQuantity > 2147483647
    ) {
      setError("Enter a positive whole-number quantity.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(API, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: productId,
          requestedQuantity,
          note: note.trim(),
        }),
      });

      if (response.status === 401) {
        setProducts([]);
        setRequests([]);
        localStorage.removeItem("employee");
        navigate("/employee/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit your request.",
        );
      }

      setQuantity("");
      setNote("");
      await loadData();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  return (
    <div className="employee-page">
      <header className="employee-header">
        <h1>Restock Requests</h1>
        <p>Request stock and track your manager’s decision.</p>
        <Link to="/employee">Back to Employee Dashboard</Link>
        {" | "}
        <Link to="/employee/inventory">Inventory Report</Link>
      </header>

      <section className="employee-panel">
        <h2>Submit a Request</h2>
        <p>
          You can request products with 20 or fewer units.
          Approval does not change stock until items are received.
        </p>

        {loading && <p role="status">Loading...</p>}

        {error && (
          <p className="employee-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="employee-success" role="status">
            {message}
          </p>
        )}

        <form onSubmit={submitRequest}>
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="restock-product">Product</label>
            <br />
            <select
              id="restock-product"
              required
              value={inventoryId}
              disabled={loading || saving}
              onChange={(event) => setInventoryId(event.target.value)}
              style={{ padding: "10px", maxWidth: "100%" }}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option
                  key={product.InventoryID}
                  value={product.InventoryID}
                >
                  {product.InventoryName} ({product.SKU}) —
                  {" "}{product.StockQuantity} remaining
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="restock-quantity">
              Quantity to Request
            </label>
            <br />
            <input
              id="restock-quantity"
              type="number"
              min="1"
              max="2147483647"
              step="1"
              required
              value={quantity}
              disabled={loading || saving}
              onChange={(event) => setQuantity(event.target.value)}
              style={{ padding: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="restock-note">Note (optional)</label>
            <br />
            <textarea
              id="restock-note"
              maxLength={500}
              rows={3}
              value={note}
              disabled={loading || saving}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why is this item needed?"
              style={{
                padding: "10px",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || saving || products.length === 0}
          >
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {!loading && !error && products.length === 0 && (
          <p>No low-stock products are currently available.</p>
        )}
      </section>

      <section className="employee-panel">
        <div className="employee-toolbar">
          <h2>My Requests</h2>
          <button
            onClick={() => loadData()}
            disabled={loading || saving}
          >
            Refresh
          </button>
        </div>

        {!loading && !error && requests.length === 0 && (
          <p>You haven’t submitted any restock requests.</p>
        )}

        <div className="employee-order-grid">
          {requests.map((request) => (
            <article
              className="employee-order"
              key={request.RequestID}
            >
              <h3>{request.InventoryName}</h3>
              <p>Request #{request.RequestID}</p>
              <p><strong>Status:</strong> {request.Status}</p>
              <p>
                <strong>Requested quantity:</strong>{" "}
                {request.RequestedQuantity}
              </p>
              <p>
                <strong>Stock when requested:</strong>{" "}
                {request.StockAtRequest}
              </p>
              <p>
                <strong>Your note:</strong>{" "}
                {request.EmployeeNote || "—"}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {formatDate(request.CreatedAt)}
              </p>
              <p>
                <strong>Reviewed:</strong>{" "}
                {formatDate(request.ReviewedAt)}
              </p>
              {request.ManagerFirstName && (
                <p>
                  <strong>Reviewed by:</strong>{" "}
                  {request.ManagerFirstName} {request.ManagerLastName}
                </p>
              )}
              <p>
                <strong>Manager note:</strong>{" "}
                {request.ManagerNote || "—"}
              </p>
              {request.FulfilledAt && (
                <p>
                  <strong>Received:</strong>{" "}
                  {formatDate(request.FulfilledAt)}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}