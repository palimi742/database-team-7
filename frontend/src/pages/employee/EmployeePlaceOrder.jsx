import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { employeeApi, money } from "./employeeApi";
import "../../css/employee/EmployeeShiftHub.css";
import { ProductImage, CategoryFilters, useCategories, ShiftNotice } from "./EmployeeProductTools";

function Search({ label, value, onChange, onSearch, busy, minLength }) {
  return (
    <form className="hub-search" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
      <label>{label}
        <input value={value} onChange={(event) => onChange(event.target.value)}
          minLength={minLength} maxLength={100} required={Boolean(minLength)} />
      </label>
      <button className="hub-button hub-secondary" disabled={busy}>Search</button>
    </form>
  );
}

export default function EmployeePlaceOrder() {
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [customers, setCustomers] = useState(null);
  const [products, setProducts] = useState([]);
  const { categories, categoryError } = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [fulfillmentType, setFulfillment] = useState("curbside");
  const [address, setAddress] = useState("");
  const [quote, setQuote] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const requestKey = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setProductLoading(true);
    employeeApi("orders/products?" + new URLSearchParams({ q: search, categoryId }), { signal: controller.signal })
      .then((data) => setProducts(data.products))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setProductLoading(false); });
    return () => controller.abort();
  }, [search, categoryId]);

  async function run(action, task) {
    setBusy(action);
    setError("");
    try { await task(); }
    catch (err) { setError(err.message); }
    finally { setBusy(""); }
  }

  function changeOrder() {
    setQuote(null);
    requestKey.current = null;
    setError("");
  }

  function changeQuantity(product, amount) {
    changeOrder();
    setItems((current) => {
      const line = current.find((item) => item.id === product.id);
      const quantity = (line?.quantity || 0) + amount;
      if (quantity < 1) return current.filter((item) => item.id !== product.id);
      if (quantity > Math.min(Number(product.stock), 10000)) return current;
      if (!line) return [...current, { ...product, quantity }];
      return current.map((item) => item.id === product.id ? { ...item, quantity } : item);
    });
  }

  const order = {
    customerId: customer?.id,
    fulfillmentType,
    deliveryAddress: address,
    items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
  };

  function review() {
    if (!customer) { setError("Search for a customer, then click their name to select them before reviewing."); return; }
    if (!items.length) { setError("Add at least one product before reviewing."); return; }
    if (fulfillmentType === "delivery" && !address.trim()) { setError("Enter a delivery address before reviewing."); return; }
    return run("review", async () => {
      setQuote(await employeeApi("orders/quote", { method: "POST", body: JSON.stringify(order) }));
    });
  }

  function place() {
    return run("place", async () => {
      requestKey.current ??= crypto.randomUUID();
      setReceipt(await employeeApi("orders", {
        method: "POST",
        body: JSON.stringify({ ...order, requestKey: requestKey.current, reviewKey: quote.reviewKey }),
      }));
    });
  }

  return (
    <main className="shift-hub">
      <div className="hub-shell">
        <Link to="/employee" className="hub-back">← Employee Dashboard</Link>
        <section className="hub-welcome">
          <span className="hub-eyebrow">FreshMart · Assisted checkout</span>
          <h1>Place a customer order</h1>
          <p>Choose a customer, build their cart, then review and submit.</p>
        </section>
        <ShiftNotice />
        {categoryError && <p className="hub-error" role="alert">Categories: {categoryError}</p>}
        {error && <p className="hub-error" role="alert">{error}</p>}
        {receipt ? (
          <section className="hub-panel" role="status">
            <h2>Order #{receipt.orderId} placed</h2>
            <p>{customer.name} · {money.format(receipt.total)} · Waiting for assignment</p>
            <Link className="hub-button" to="/employee">Back to dashboard</Link>
          </section>
        ) : (
          <div className="hub-checkout">
            <div className="hub-stack">
              <section className="hub-panel">
                <h2>1. Find customer</h2>
                <Search label="Name or phone" value={customerQuery} onChange={setCustomerQuery}
                  busy={Boolean(busy)} minLength={2} onSearch={() => run("customers", async () => {
                    setCustomers((await employeeApi("orders/customers?q=" + encodeURIComponent(customerQuery))).customers);
                  })} />
                {!customer && <p className="emp-help">Search, then click a customer below to select them. Typing a name alone does not select an account.</p>}
                {customers?.length === 0 && <p>No matching customers. Try their phone number.</p>}
                {customers?.map((entry) => (
                  <button key={entry.id} type="button" className="hub-choice" disabled={Boolean(busy)}
                    aria-pressed={customer?.id === entry.id} onClick={() => {
                      changeOrder();
                      setCustomer(entry);
                      setAddress(entry.address || "");
                    }}>
                    {entry.name} · phone ending {entry.phoneEnd}
                  </button>
                ))}
                {customer && <p className="hub-muted">Selected: <strong>{customer.name}</strong></p>}
              </section>
              <section className="hub-panel">
                <h2>2. Add products</h2>
                <Search label="Product name or SKU" value={productQuery} onChange={setProductQuery}
                  busy={Boolean(busy) || productLoading} onSearch={() => setSearch(productQuery.trim())} />
                <CategoryFilters categories={categories} value={categoryId} onChange={setCategoryId} disabled={Boolean(busy)} />
                {productLoading && <p role="status">Loading products…</p>}
                {!products.length && <p>No products to show.</p>}
                <ul className="hub-list">
                  {products.map((product) => (
                    <li key={product.id}>
                      <div className="emp-product-line"><div><strong>{product.name}</strong><br /><small>{money.format(product.price)} · {product.stock} in stock</small></div>
                        <ProductImage id={product.id} url={product.ImageURL} name={product.name} /></div>
                      <button className="hub-button hub-secondary" aria-label={`Add ${product.name}`}
                        disabled={Boolean(busy) || (items.find((item) => item.id === product.id)?.quantity ?? 0) >= Math.min(product.stock, 10000)}
                        onClick={() => changeQuantity(product, 1)}>Add</button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <section className="hub-panel hub-cart">
              <h2>3. Review cart</h2>
              {!items.length && <p>Products you add will appear here.</p>}
              <ul className="hub-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div className="emp-product-line"><div><strong>{item.name}</strong><br /><small>{item.quantity} × {money.format(item.price)}</small></div>
                      <ProductImage id={item.id} url={item.ImageURL} name={item.name} /></div>
                    <div className="hub-quantity">
                      <button className="hub-button hub-secondary" aria-label={`Remove one ${item.name}`}
                        disabled={Boolean(busy)} onClick={() => changeQuantity(item, -1)}>−</button>
                      <button className="hub-button hub-secondary" aria-label={`Add one ${item.name}`}
                        disabled={Boolean(busy) || item.quantity >= Math.min(item.stock, 10000)}
                        onClick={() => changeQuantity(item, 1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
              <label className="hub-field">Fulfillment
                <select disabled={Boolean(busy)} value={fulfillmentType} onChange={(event) => {
                  changeOrder(); setFulfillment(event.target.value);
                }}>
                  <option value="curbside">Curbside pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </label>
              {fulfillmentType === "delivery" && (
                <label className="hub-field">Delivery address
                  <input disabled={Boolean(busy)} maxLength={150} value={address}
                    onChange={(event) => { changeOrder(); setAddress(event.target.value); }} />
                </label>
              )}
              <p>{fulfillmentType === "delivery" ? "Pay on delivery" : "Pay at pickup"}</p>
              {quote && (
                <div className="hub-review">
                  <h3>Reviewed total</h3>
                  {quote.items.map((item) => (
                    <p key={item.productId}>{item.name} × {item.quantity} · {money.format(item.lineTotal)}</p>
                  ))}
                  <p>Delivery fee: {money.format(quote.totals.deliveryFee)}</p>
                  <p><strong>Total: {money.format(quote.totals.total)}</strong></p>
                </div>
              )}
              {!customer && <p className="emp-help">Next: select a customer in step 1 to review this cart.</p>}
              <div className="hub-quantity">
                <button className="hub-button hub-secondary" disabled={Boolean(busy)} onClick={review}>
                  {busy === "review" ? "Reviewing…" : quote ? "Refresh review" : "Review total"}
                </button>
                {quote && <button className="hub-button" disabled={Boolean(busy)} onClick={place}>
                  {busy === "place" ? "Placing…" : "Place Order"}
                </button>}
              </div>
              {error && <p className="hub-error">{error}</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}