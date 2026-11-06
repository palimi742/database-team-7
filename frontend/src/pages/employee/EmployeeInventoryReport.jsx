import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/employee/EmployeeFulfillment.css";

const API = "/api/reports/inventory/stock";

const statusColors = {
  "Out of stock": "#b91c1c",
  Low: "#b45309",
  Normal: "#15803d",
  High: "#1d4ed8",
};

export default function EmployeeInventoryReport() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const parameters = new URLSearchParams(filters);

        const response = await fetch(`${API}?${parameters}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });

        if (response.status === 401) {
          setItems([]);
          setSummary(null);
          localStorage.removeItem("employee");
          navigate("/employee/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load inventory.",
          );
        }

        setItems(data.items);
        setSummary(data.summary);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setItems([]);
          setSummary(null);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [filters, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadReport(controller.signal);

    return () => controller.abort();
  }, [loadReport]);

  function applyFilters(event) {
    event.preventDefault();

    setFilters({
      search: search.trim(),
      status,
    });
  }

  const cards = summary
    ? [
        ["Total Products", summary.TotalProducts],
        ["Out of Stock", summary.OutOfStock],
        ["Low Stock", summary.LowStock],
        ["Normal Stock", summary.NormalStock],
        ["High Stock", summary.HighStock],
      ]
    : [];

  return (
    <div className="employee-page">
      <header className="employee-header">
        <h1>Inventory Stock Report</h1>
        <p>Check product quantities and stock levels.</p>
        <Link to="/employee">Back to Employee Dashboard</Link>
      </header>

      {summary && (
        <section
          className="employee-order-grid"
          aria-label="Inventory summary"
        >
          {cards.map(([label, count]) => (
            <article className="employee-panel" key={label}>
              <h2>{label}</h2>
              <p style={{ fontSize: "2rem", fontWeight: 700 }}>
                {count}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="employee-panel">
        <h2>Products</h2>

        <p>
          Low: 1–20 | Normal: 21–74 | High: 75+
          | Out of stock: 0
        </p>

        <form
          className="employee-search"
          onSubmit={applyFilters}
        >
          <label htmlFor="inventory-search">Search</label>
          <input
            id="inventory-search"
            value={search}
            maxLength={100}
            placeholder="Product name or SKU"
            onChange={(event) => setSearch(event.target.value)}
          />

          <label htmlFor="stock-status">Stock Status</label>
          <select
            id="stock-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="All">All</option>
            <option value="Out of stock">Out of stock</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>

          <button type="submit" disabled={loading}>
            Apply Filters
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => loadReport()}
          >
            Refresh
          </button>
        </form>

        {loading && (
          <p role="status">Loading inventory...</p>
        )}

        {error && (
          <p className="employee-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <p>{items.length} products found.</p>

            {items.length === 0 ? (
              <p>No products match your filters.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "SKU",
                        "Product",
                        "Quantity",
                        "Stock Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          style={{
                            padding: "12px",
                            borderBottom: "2px solid #ddd",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr key={item.InventoryID}>
                        <td style={cellStyle}>{item.SKU}</td>
                        <td style={cellStyle}>
                          {item.InventoryName}
                        </td>
                        <td style={cellStyle}>
                          {item.StockQuantity}
                        </td>
                        <td style={cellStyle}>
                          <span
                            style={{
                              color: statusColors[item.StockStatus],
                              fontWeight: 700,
                            }}
                          >
                            {item.StockStatus}
                          </span>
                          {Number(item.StockQuantity) <= 20 && (
  <div style={{ marginTop: "8px" }}>
    <Link
      to={`/employee/restock-requests?inventoryId=${item.InventoryID}`}
    >
      Request Restock
    </Link>
  </div>
)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};