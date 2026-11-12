import DismissButton from "../../components/layout/DismissButton.jsx";
import { managerFetch } from "../../api.js";
import { useEffect, useRef, useState } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/ManagerPromotions.css";

const emptyForm = {
  CouponName: "",
  Description: "",
  UsesPerClip: "1",
  CategoryIDs: [],
  ProductIDs: [],
  DiscountAmount: "",
  startsAt: "",
  endsAt: "",
};

function ManagerPromotions() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const dialog = useRef(null);
  const [target, setTarget] = useState("products");
  const [itemSearch, setItemSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("All");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadPromotions() {
    setError("");
    setLoading(true);
    try {
      const responses = await Promise.all([
        managerFetch("/api/manager/promotions/coupons"),
        managerFetch("/api/categories"),
        managerFetch("/api/manager/products"),
      ]);
      const data = await Promise.all(responses.map((res) => res.json()));

      for (let index = 0; index < responses.length; index++) {
        if (!responses[index].ok) {
          throw new Error(data[index].message || "Unable to load offers.");
        }
      }

      setOffers(data[0]);
      setCategories(data[1]);
      setProducts(data[2]);
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

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    if (editor !== null && !modal.open) modal.showModal();
    if (editor === null && modal.open) modal.close();
  }, [editor, loading]);

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

  function openEditor(offer = null) {
    setDeleting(null);
    setError("");
    setNotice("");
    setItemSearch("");
    setProductCategory("");
    setTarget(
      offer?.CategoryIDs.length
        ? offer.ProductIDs.length
          ? ""
          : "categories"
        : "products",
    );

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

  function selectItem(id) {
    if (target === "categories") {
      setForm({ ...form, CategoryIDs: [id] });
      return;
    }
    const ProductIDs = form.ProductIDs.includes(id)
      ? form.ProductIDs.filter((value) => value !== id)
      : [...form.ProductIDs, id];
    setForm({ ...form, ProductIDs });
  }

  function closeEditor() {
    setEditor(null);
    setError("");
  }

  function openDelete(offer) {
    setEditor(null);
    setDeleting(offer);
    setError("");
    setNotice("");
  }

  function showInvalidField(event) {
    const field = event.target;
    if (
      event.currentTarget.querySelector("input:invalid, textarea:invalid") !==
      field
    )
      return;
    const label = field.labels?.[0]?.firstChild?.textContent.trim();
    setError(
      label ? `${label}: ${field.validationMessage}` : field.validationMessage,
    );
  }

  // Save a new offer or update the selected offer in the database.
  async function savePromotion(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const fields = new FormData(event.currentTarget);
    const start = new Date(
      `${fields.get("startsAt-date")}T${fields.get("startsAt-time")}`,
    );
    const end = new Date(
      `${fields.get("endsAt-date")}T${fields.get("endsAt-time")}`,
    );
    if (!(end > start)) {
      setError("End time must be after start time.");
      return;
    }

    const CategoryIDs = target === "categories" ? form.CategoryIDs : [];
    const ProductIDs = target === "products" ? form.ProductIDs : [];
    if (CategoryIDs.length !== 1 && ProductIDs.length === 0) {
      setError("Select specific products or one whole category.");
      return;
    }

    setSaving(true);
    try {
      let url = "/api/manager/promotions/coupons";
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
          CategoryIDs,
          ProductIDs,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to save offer.");
      }

      setEditor(null);
      setNotice("Coupon saved.");
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
        `/api/manager/promotions/coupons/${deleting.id}`,
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

  const options =
    target === "categories"
      ? categories.map((category) => ({
          id: category.CategoryID,
          name: category.CategoryName,
        }))
      : products.map((product) => ({
          id: product.InventoryID,
          name: product.InventoryName,
          categoryID: product.CategoryID,
          active: Boolean(Number(product.IsActive)),
        }));
  const selectedIDs =
    target === "categories" ? form.CategoryIDs : form.ProductIDs;
  const selectedItems = options.filter((item) => selectedIDs.includes(item.id));
  const matchingItems = options.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(itemSearch.trim().toLowerCase());
    const matchesCategory =
      target !== "products" ||
      !productCategory ||
      String(item.categoryID) === productCategory;
    const isAvailable = target !== "products" || item.active;
    return isAvailable && matchesSearch && matchesCategory;
  });

  const searchInput = search.trim().toLowerCase();
  const rows = offers.filter((offer) => {
    const name = offer.CouponName;
    const matchesSearch = name.toLowerCase().includes(searchInput);
    const matchesCategory =
      categoryFilter === "all" ||
      offer.CategoryIDs.includes(Number(categoryFilter));
    const matchesStatus = filter === "All" || getOfferStatus(offer) === filter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  function formatDate(value) {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function renderPagination() {
    return (
      <div className="promotion-pagination">
        <label>
          Offers per page{" "}
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
        <span aria-live="polite">
          Showing {rows.length ? startIndex + 1 : 0}–
          {Math.min(startIndex + pageSize, rows.length)} of {rows.length} offers
        </span>
        <nav aria-label="Offer pages">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    );
  }
  return (
    <div>
      <ManagerSidebar />
      <main className="manager-page manager-promotions">
        <header className="promotion-heading">
          <div>
            <h1>Coupons</h1>
            <p>
              Manage product and category offers. Times use your local time
              zone.
            </p>
          </div>
          <div className="promotion-toolbar">
            <button disabled={loading || saving} onClick={loadPromotions}>
              Refresh
            </button>
            <button
              className="coupon-primary"
              disabled={
                loading || saving || (!categories.length && !products.length)
              }
              onClick={() => openEditor()}
            >
              + Add Coupon
            </button>
          </div>
        </header>
        {error && editor === null && <p role="alert">{error}</p>}
        {notice && (
          <p className="promotion-notice" role="status">
            {notice} <DismissButton onClick={() => setNotice("")} />
          </p>
        )}
        {loading && <p>Loading offers...</p>}
        {!loading && (
          <>
            <div className="promotion-toolbar promotion-filters">
              <label>
                Search offers
                <input
                  type="search"
                  placeholder="Search by offer name"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label>
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All categories</option>
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
                Status{" "}
                <select
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  {["All", "Active", "Scheduled", "Expired"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            {!categories.length && !products.length && (
              <p>Add a category or product before creating a coupon.</p>
            )}
            <dialog
              ref={dialog}
              className="coupon-dialog"
              aria-labelledby="coupon-dialog-title"
              onCancel={(event) => {
                event.preventDefault();
                if (!saving) closeEditor();
              }}
            >
              <form onSubmit={savePromotion} onInvalid={showInvalidField}>
                <header className="coupon-dialog-header">
                  <h2 id="coupon-dialog-title">
                    {editor === "new" ? "Add Coupon" : "Edit Coupon"}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close"
                    disabled={saving}
                    onClick={closeEditor}
                  >
                    ×
                  </button>
                </header>
                <div className="coupon-dialog-body">
                  <div className="coupon-dialog-columns">
                    <section>
                      <h3>Coupon details</h3>
                      <fieldset className="coupon-details" disabled={saving}>
                        <label className="coupon-wide">
                          Coupon name
                          <input
                            name="CouponName"
                            placeholder="Example: Dairy Deal"
                            value={form.CouponName}
                            onChange={handleFieldChange}
                            maxLength={100}
                            required
                          />
                        </label>
                        <label className="coupon-wide">
                          Description
                          <textarea
                            name="Description"
                            placeholder="Example: Save $1 on each eligible dairy item."
                            value={form.Description}
                            onChange={handleFieldChange}
                            maxLength={500}
                            rows={3}
                            required
                          />
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
                          Limit
                          <input
                            name="UsesPerClip"
                            aria-describedby="coupon-limit-help"
                            type="number"
                            min="1"
                            max="2147483647"
                            step="1"
                            value={form.UsesPerClip}
                            onChange={handleFieldChange}
                            required
                          />
                          <small id="coupon-limit-help">
                            One completed order counts as one use, even when
                            this coupon discounts multiple items.
                          </small>
                        </label>
                        {editor !== null &&
                          [
                            ["startsAt", "Start"],
                            ["endsAt", "End"],
                          ].map(([field, label]) => {
                            const [date = "", time = ""] =
                              form[field].split("T");
                            return (
                              <div
                                className="coupon-date-time coupon-wide"
                                key={field}
                              >
                                <label>
                                  {label} date
                                  <input
                                    type="date"
                                    min="1000-01-01"
                                    max="9999-12-31"
                                    name={`${field}-date`}
                                    defaultValue={date}
                                    required
                                  />
                                </label>
                                <label>
                                  {label} time
                                  <input
                                    type="time"
                                    name={`${field}-time`}
                                    defaultValue={time}
                                    required
                                  />
                                </label>
                              </div>
                            );
                          })}
                      </fieldset>
                    </section>
                    <section>
                      <h3>Applies to</h3>
                      <div
                        className="coupon-targets"
                        role="group"
                        aria-label="Eligibility type"
                      >
                        {[
                          ["products", "Specific products"],
                          ["categories", "Whole category"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={target === value}
                            disabled={saving}
                            onClick={() => {
                              setTarget(value);
                              setItemSearch("");
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {target && (
                        <>
                          <input
                            className="coupon-search"
                            type="search"
                            aria-label={
                              target === "products"
                                ? "Search products"
                                : "Search categories"
                            }
                            placeholder={
                              target === "products"
                                ? "Search products"
                                : "Search categories"
                            }
                            value={itemSearch}
                            onChange={(event) =>
                              setItemSearch(event.target.value)
                            }
                            disabled={saving}
                          />
                          {target === "products" && (
                            <select
                              className="coupon-category-filter"
                              aria-label="Filter products by category"
                              value={productCategory}
                              onChange={(event) =>
                                setProductCategory(event.target.value)
                              }
                              disabled={saving}
                            >
                              <option value="">All categories</option>
                              {categories.map((category) => (
                                <option
                                  key={category.CategoryID}
                                  value={category.CategoryID}
                                >
                                  {category.CategoryName}
                                </option>
                              ))}
                            </select>
                          )}
                          <fieldset
                            className="coupon-options"
                            aria-label="Search results"
                            disabled={saving}
                          >
                            {matchingItems.map((item) => (
                              <label key={item.id}>
                                <input
                                  type={
                                    target === "products" ? "checkbox" : "radio"
                                  }
                                  name={
                                    target === "categories"
                                      ? "coupon-category"
                                      : undefined
                                  }
                                  checked={
                                    selectedIDs.includes(item.id) &&
                                    (target === "products" ||
                                      selectedIDs.length === 1)
                                  }
                                  onChange={() => selectItem(item.id)}
                                />
                                {item.name}
                              </label>
                            ))}
                            {!matchingItems.length && <p>No matches.</p>}
                          </fieldset>
                          {selectedItems.length > 0 && (
                            <>
                              <p>{selectedItems.length} selected</p>
                              <div className="coupon-selected">
                                {selectedItems.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    aria-label={`Remove ${item.name}`}
                                    disabled={saving}
                                    onClick={() => {
                                      const field =
                                        target === "products"
                                          ? "ProductIDs"
                                          : "CategoryIDs";
                                      setForm({
                                        ...form,
                                        [field]: selectedIDs.filter(
                                          (id) => id !== item.id,
                                        ),
                                      });
                                    }}
                                  >
                                    {item.name}
                                    {target === "products" && !item.active
                                      ? " (inactive)"
                                      : ""}{" "}
                                    ×
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </section>
                  </div>
                </div>
                <footer className="coupon-dialog-footer">
                  {error && (
                    <p className="coupon-save-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="coupon-dialog-actions">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={closeEditor}
                    >
                      Cancel
                    </button>
                    <button
                      className="coupon-primary"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save coupon"}
                    </button>
                  </div>
                </footer>
              </form>
            </dialog>
            {deleting && (
              <div className="promotion-editor" role="alert">
                <p>
                  Delete {deleting.CouponName}? This removes the offer for
                  customers.
                </p>
                <button disabled={saving} onClick={deletePromotion}>
                  Confirm delete
                </button>
                <button disabled={saving} onClick={() => setDeleting(null)}>
                  Cancel
                </button>
              </div>
            )}
            {totalPages > 1 && renderPagination()}
            <div className="promotion-table">
              <table>
                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Limit</th>
                    <th>Discount</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th aria-label="Coupon actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((offer) => {
                    const eligibleItems = categories
                      .filter((category) =>
                        offer.CategoryIDs.includes(category.CategoryID),
                      )
                      .map((category) => category.CategoryName)
                      .concat(
                        products
                          .filter((product) =>
                            offer.ProductIDs.includes(product.InventoryID),
                          )
                          .map((product) => product.InventoryName),
                      );
                    return (
                      <tr key={offer.id}>
                        <td>
                          <strong>{offer.CouponName}</strong>
                          {offer.Description && (
                            <div className="promotion-secondary">
                              {offer.Description}
                            </div>
                          )}
                          {eligibleItems.length > 0 && (
                            <>
                              <button
                                type="button"
                                className="promotion-eligible-more"
                                popoverTarget={`coupon-eligible-${offer.id}`}
                                aria-label={`See all eligible items for ${offer.CouponName}`}
                              >
                                See more
                              </button>
                              <div
                                id={`coupon-eligible-${offer.id}`}
                                className="promotion-more promotion-eligible-list"
                                popover="auto"
                                aria-label={`Eligible items for ${offer.CouponName}`}
                              >
                                <ul>
                                  {eligibleItems.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )}
                        </td>
                        <td>{offer.UsesPerClip}</td>
                        <td>
                          <span className="promotion-discount">
                            ${Number(offer.DiscountAmount).toFixed(2)} off
                          </span>
                        </td>
                        <td>
                          <div>{formatDate(offer.startsAt)}</div>
                          <div className="promotion-secondary">
                            to {formatDate(offer.endsAt)}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`promotion-status promotion-status-${getOfferStatus(offer).toLowerCase()}`}
                          >
                            {getOfferStatus(offer)}
                          </span>
                        </td>
                        <td>
                          <div className="promotion-actions">
                            <button
                              disabled={saving}
                              onClick={() => openEditor(offer)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="coupon-delete"
                              disabled={saving}
                              aria-label={`Delete ${offer.CouponName}`}
                              onClick={() => openDelete(offer)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6}>
                        No coupons match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ManagerPromotions;
