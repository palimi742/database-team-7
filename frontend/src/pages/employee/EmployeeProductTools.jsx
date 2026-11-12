import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi } from "./employeeApi";
import "../../css/employee/EmployeeEnhancements.css";

export function ProductImage({ id, url, name }) {
  const [failed, setFailed] = useState(0);
  useEffect(() => { setFailed(0); }, [id, url]);
  // Inventory.ImageURL is authoritative; ProductImages is the database fallback.
  const safeUrl = typeof url === "string" && /^(https?:\/\/|\/(?!\/))/.test(url) ? url : null;
  const sources = [...new Set([safeUrl, id ? `/api/employee/inventory/${id}/image` : null].filter(Boolean))];
  return failed < sources.length ? <img className="emp-product-image" src={sources[failed]}
    alt={name || "Product"} loading="lazy" onError={() => setFailed((value) => value + 1)} />
    : <span className="emp-product-image emp-image-missing" role="img" aria-label={`No image available for ${name || "product"}`}>—</span>;
}

export function CategoryFilters({ categories, value, onChange, disabled = false }) {
  return <div className="emp-category-filters" role="group" aria-label="Product category">
    {[{ CategoryID: "", CategoryName: "All" }, ...categories].map((category) => (
      <button type="button" key={category.CategoryID} disabled={disabled}
        aria-pressed={String(value) === String(category.CategoryID)}
        onClick={() => onChange(String(category.CategoryID))}>{category.CategoryName}</button>
    ))}
  </div>;
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [categoryError, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    employeeApi("inventory/categories", { signal: controller.signal })
      .then((data) => setCategories(data.categories))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, []);
  return { categories, categoryError };
}

export function ShiftNotice() {
  const [shift, setShift] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const load = () => employeeApi("time", { signal: controller.signal })
      .then((data) => { setShift(data.shifts.some((entry) => !entry.ClockOut)); setError(""); })
      .catch((err) => { if (err.name !== "AbortError") { setShift(null); setError(err.message); } });
    load();
    window.addEventListener("focus", load);
    return () => { controller.abort(); window.removeEventListener("focus", load); };
  }, []);
  if (shift === true) return <p className="emp-shift-notice emp-on-shift">● You’re clocked in. Ready to work.</p>;
  return <p className="emp-shift-notice" role="status">{error ? `Shift status unavailable: ${error}`
    : shift === false ? "Please clock in before placing an order or requesting restock." : "Checking shift status…"}
    {" "}<Link to="/employee">Go to time clock →</Link></p>;
}

export function StockBadge({ status }) {
  const colors = { "Out of stock": "red", Low: "amber", Normal: "green", High: "blue" };
  return <span className={`emp-stock-badge emp-${colors[status] || "blue"}`}>{status}</span>;
}