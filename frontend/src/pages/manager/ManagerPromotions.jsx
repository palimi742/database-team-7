import { managerFetch } from "../../api.js";
import { useEffect, useState } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/ManagerPromotions.css";

const emptyForm = {
  CouponName: "",
  CategoryID: "",
  DiscountAmount: "",
  startsAt: "",
  endsAt: "",
};

function ManagerPromotions() {
  const [type, setType] = useState("coupons");
  const [offers, setOffers] = useState({ coupons: [], sales: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("All");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load both offer lists and the categories used by the form.
  async function loadPromotions() {
    setError("");
    setLoading(true);
    try {
      const responses = await Promise.all([
        managerFetch("/api/manager/promotions/coupons"),
        managerFetch("/api/manager/promotions/sales"),
        managerFetch("/api/categories"),
      ]);
      const data = await Promise.all(responses.map((res) => res.json()));

      for (let index = 0; index < responses.length; index++) {
        if (!responses[index].ok) {
          throw new Error(data[index].message || "Unable to load offers.");
        }
      }

      setOffers({ coupons: data[0], sales: data[1] });
      setCategories(data[2]);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  // Convert database timestamps to local values for the date inputs.
  function formatInputTime(value) {
    const date = new Date(value);
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );
    return localDate.toISOString().slice(0, 16);
  }

  function getOfferStatus(offer) {
    const now = Date.now();
    if (now < Date.parse(offer.startsAt)) {
      return "Scheduled";
    }
    if (now > Date.parse(offer.endsAt)) {
      return "Expired";
    }
    return "Active";
  }

  function selectType(value) {
    setType(value);
    setPage(1);
    setEditor(null);
    setDeleting(null);
    setError("");
    setNotice("");
  }

  function openEditor(offer = null) {
    setDeleting(null);
    setError("");
    setNotice("");

    if (offer === null) {
      setEditor("new");
      setForm({ ...emptyForm });
      return;
    }

    setEditor(offer.id);
    setForm({
      ...offer,
      startsAt: formatInputTime(offer.startsAt),
      endsAt: formatInputTime(offer.endsAt),
    });
  }

  function handleFieldChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function openDelete(offer) {
    setEditor(null);
    setDeleting(offer);
    setError("");
    setNotice("");
  }

  // Save a new offer or update the selected offer in the database.
  async function savePromotion(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (Date.parse(form.endsAt) <= Date.parse(form.startsAt)) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      let url = `/api/manager/promotions/${type}`;
      let method = "POST";
      if (editor !== "new") {
        url = `${url}/${editor}`;
        method = "PUT";
      }

      const res = await managerFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to save offer.");
      }

      setEditor(null);
      setNotice("Offer saved.");
      await loadPromotions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePromotion() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await managerFetch(
        `/api/manager/promotions/${type}/${deleting.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to delete offer.");
      }

      setDeleting(null);
      setNotice("Offer deleted.");
      await loadPromotions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const coupon = type === "coupons";
  const searchInput = search.trim().toLowerCase();
  const rows = offers[type].filter((offer) => {
    const name = offer.CouponName || `${offer.CategoryName} sale`;
    const matchesSearch = name.toLowerCase().includes(searchInput);
    const matchesCategory = categoryFilter === "all" || String(offer.CategoryID) === categoryFilter;
    const matchesStatus = filter === "All" || getOfferStatus(offer) === filter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  function formatDate(value) {
    return new Date(value).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function renderPagination(position) {
    return (
      <div className="promotion-pagination">
        <label>
          Offers per page{" "}
          <select value={pageSize} onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
        <span aria-live="polite">
          Showing {rows.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, rows.length)} of {rows.length} offers
        </span>
        <nav aria-label={`Offer pages ${position}`}>
          <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
        </nav>
      </div>
    );
  }
  return (
    <div>
      <ManagerSidebar />
      <main className="manager-main-dashboard manager-promotions">
        <h1>Coupons &amp; Sales</h1>
        <p>
          Create category offers with dollar discounts. Times use your local
          time zone.
        </p>
        <div className="promotion-toolbar promotion-tabs" aria-label="Promotion type">
          {["coupons", "sales"].map((value) => (
            <button
              key={value}
              disabled={saving}
              aria-pressed={type === value}
              onClick={() => selectType(value)}
            >
              {value === "coupons" ? "Coupons" : "Seasonal Sales"}
            </button>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {loading && <p>Loading offers...</p>}
        {!loading && (
          <>
            <div className="promotion-toolbar">
              <button
                disabled={saving || !categories.length}
                onClick={() => openEditor()}
              >
                Add {coupon ? "Coupon" : "Sale"}
              </button>
              <button disabled={saving} onClick={loadPromotions}>
                Refresh
              </button>
            </div>
            <div className="promotion-toolbar promotion-filters">
              <label>
                Search offers
                <input type="search" placeholder="Search by offer name" value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
              </label>
              <label>
                Category
                <select value={categoryFilter} onChange={(event) => {
                  setCategoryFilter(event.target.value); setPage(1);
                }}>
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.CategoryID} value={category.CategoryID}>{category.CategoryName}</option>
                  ))}
                </select>
              </label>
              <label>
                Status{" "}
                <select
                  value={filter}
                  onChange={(event) => { setFilter(event.target.value); setPage(1); }}
                >
                  {["All", "Active", "Scheduled", "Expired"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            {!categories.length && (
              <p>Add categories before creating offers.</p>
            )}
            {editor !== null && (
              <form className="promotion-editor" onSubmit={savePromotion}>
                <h2>
                  {editor === "new" ? "Add" : "Edit"}{" "}
                  {coupon ? "Coupon" : "Sale"}
                </h2>
                <fieldset disabled={saving}>
                  {coupon && (
                    <label>
                      Coupon name
                      <input
                        name="CouponName"
                        value={form.CouponName}
                        onChange={handleFieldChange}
                        maxLength={100}
                        required
                      />
                    </label>
                  )}
                  <label>
                    Category
                    <select
                      name="CategoryID"
                      value={form.CategoryID}
                      onChange={handleFieldChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option
                          key={category.CategoryID}
                          value={category.CategoryID}
                        >
                          {category.CategoryName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Discount ($ off)
                    <input
                      name="DiscountAmount"
                      type="number"
                      min="0.01"
                      max="99999999.99"
                      step="0.01"
                      value={form.DiscountAmount}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>
                  <label>
                    Starts at
                    <input
                      name="startsAt"
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>
                  <label>
                    Ends at
                    <input
                      name="endsAt"
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={handleFieldChange}
                      required
                    />
                  </label>
                </fieldset>
                <button disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save offer"}
                </button>
                <button
                  disabled={saving}
                  type="button"
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </button>
              </form>
            )}
            {deleting && (
              <div className="promotion-editor" role="alert">
                <p>
                  Delete{" "}
                  {deleting.CouponName || `${deleting.CategoryName} sale`}? This
                  removes the offer for customers.
                </p>
                <button disabled={saving} onClick={deletePromotion}>
                  Confirm delete
                </button>
                <button disabled={saving} onClick={() => setDeleting(null)}>
                  Cancel
                </button>
              </div>
            )}
            {renderPagination("top")}
            <div className="promotion-table">
              <table>
                <thead>
                  <tr>
                    {coupon && <th>Name</th>}
                    <th>Category</th>
                    <th>Discount</th>
                    <th>Starts</th>
                    <th>Ends</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((offer) => (
                    <tr key={offer.id}>
                      {coupon && <td>{offer.CouponName}</td>}
                      <td>{offer.CategoryName}</td>
                      <td>${Number(offer.DiscountAmount).toFixed(2)} off</td>
                      <td>{formatDate(offer.startsAt)}</td>
                      <td>{formatDate(offer.endsAt)}</td>
                      <td>{getOfferStatus(offer)}</td>
                      <td>
                        <div className="promotion-actions">
                        <button
                          disabled={saving}
                          onClick={() => openEditor(offer)}
                        >
                          Edit
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => openDelete(offer)}
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={coupon ? 7 : 6}>
                        No {coupon ? "coupons" : "sales"} match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination("bottom")}
          </>
        )}
      </main>
    </div>
  );
}

export default ManagerPromotions;
