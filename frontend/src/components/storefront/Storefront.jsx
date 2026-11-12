import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { money } from "../../api.js";
import { useShop } from "../../context/ShopContext.jsx";
import SignInModal from "../auth/SignInModal.jsx";
import ProductPhoto from "./ProductPhoto";
import StoreIcon from "./StoreIcon";
import StorefrontCart from "./StorefrontCart";
import "../../css/customer/Storefront.css";

const sorts = ["featured", "price-asc", "price-desc", "name"];

export default function Storefront() {
  const {
    addItem,
    cart,
    cartId,
    isSignedIn,
    updating,
    error: cartError,
  } = useShop();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productError, setProductError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);
  const results = useRef(null);
  const search = params.get("q") || "";
  const category = params.get("category") || "All";
  const inStockOnly = params.get("stock") === "1";
  const sort = sorts.includes(params.get("sort"))
    ? params.get("sort")
    : "featured";

  useEffect(() => {
    const controller = new AbortController();
    // Fetch products independently so a category request cannot hide the whole catalog.
    async function loadProducts() {
      setLoading(true);
      setProductError("");
      try {
        const response = await fetch("/api/products", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data))
          throw new Error(data?.message || "Unable to load products.");
        setProducts(
          data.filter(
            (item) =>
              item.IsActive === undefined || Number(item.IsActive) === 1,
          ),
        );
      } catch (error) {
        if (error.name !== "AbortError") setProductError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    async function loadCategories() {
      setCategoryError("");
      try {
        const response = await fetch("/api/categories", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data))
          throw new Error(data?.message || "Unable to load categories.");
        setCategories(data);
      } catch (error) {
        if (error.name !== "AbortError") setCategoryError(error.message);
      }
    }
    loadProducts();
    loadCategories();
    return () => controller.abort();
  }, [reload]);

  function filter(name, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });
  }
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products
      .filter((item) => {
        const searchable =
          `${item.InventoryName || ""} ${item.SKU || ""} ${item.CategoryName || ""}`.toLocaleLowerCase();
        return (
          (category === "All" || String(item.CategoryID) === category) &&
          searchable.includes(query) &&
          (!inStockOnly || Number(item.StockQuantity) > 0)
        );
      })
      .sort((a, b) => {
        // Show available products first for the default view; explicit sort choices sort the full result.
        if (sort === "featured")
          return (
            Number(Number(b.StockQuantity) > 0) -
              Number(Number(a.StockQuantity) > 0) ||
            a.InventoryName.localeCompare(b.InventoryName)
          );
        if (sort === "price-asc")
          return (
            Number(a.Price) - Number(b.Price) ||
            a.InventoryName.localeCompare(b.InventoryName)
          );
        if (sort === "price-desc")
          return (
            Number(b.Price) - Number(a.Price) ||
            a.InventoryName.localeCompare(b.InventoryName)
          );
        return a.InventoryName.localeCompare(b.InventoryName);
      });
  }, [products, search, category, inStockOnly, sort]);
  const quantities = new Map(
    cart.items.map((item) => [Number(item.productId), Number(item.quantity)]),
  );
  const selectedName = categories.find(
    (entry) => String(entry.CategoryID) === category,
  )?.CategoryName;
  const heading = search.trim()
    ? `Results for “${search.trim()}”`
    : category !== "All"
      ? selectedName || "Selected category"
      : "Fresh picks for your week";
  function scrollToProducts(event) {
    event.preventDefault();
    results.current?.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    results.current?.focus({ preventScroll: true });
  }

  return (
    <main className="fm-store">
      <div className="fm-store-shell">
        {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
        {location.state?.orderMessage && (
          <p className="fm-store-success" role="status">
            {location.state.orderMessage}
          </p>
        )}
        {cartError && (
          <p className="fm-store-error" role="alert">
            {cartError}
          </p>
        )}
        <div className="fm-store-layout">
          <div className="fm-store-main">
            <section className="fm-store-hero" aria-labelledby="fm-store-title">
              <div className="fm-store-hero-copy">
                <span className="fm-store-eyebrow">
                  FreshMart · Your everyday market
                </span>
                <h1 id="fm-store-title">
                  Good food
                  <br />
                  starts here.
                </h1>
                <p>Fresh finds for your everyday table.</p>
                <a
                  className="fm-store-button"
                  href="#fm-products"
                  onClick={scrollToProducts}
                >
                  Shop groceries <StoreIcon name="arrow" size={20} />
                </a>
              </div>
            </section>
            <div
              className="fm-store-categories"
              role="group"
              aria-label="Shop by category"
            >
              <button
                type="button"
                aria-pressed={category === "All"}
                onClick={() => filter("category", "")}
              >
                All
              </button>
              {categories.map((entry) => (
                <button
                  type="button"
                  key={entry.CategoryID}
                  aria-pressed={category === String(entry.CategoryID)}
                  onClick={() => filter("category", String(entry.CategoryID))}
                >
                  {entry.CategoryName}
                </button>
              ))}
            </div>
            {categoryError && (
              <div className="fm-store-error" role="alert">
                Categories: {categoryError}{" "}
                <button
                  type="button"
                  onClick={() => setReload((value) => value + 1)}
                >
                  Retry
                </button>
              </div>
            )}
            <section
              id="fm-products"
              className="fm-store-results"
              tabIndex={-1}
              ref={results}
              aria-labelledby="fm-products-title"
            >
              <div className="fm-store-results-heading">
                <div>
                  <h2 id="fm-products-title">{heading}</h2>
                  {!loading && !productError && (
                    <p role="status">
                      {visibleProducts.length}{" "}
                      {visibleProducts.length === 1 ? "product" : "products"} to
                      explore
                    </p>
                  )}
                </div>
                <label className="fm-stock-toggle">
                  <span>In stock only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) =>
                      filter("stock", event.target.checked ? "1" : "")
                    }
                  />
                  <span className="fm-toggle-track" aria-hidden="true" />
                </label>
              </div>
              <div className="fm-store-sort">
                <label>
                  Sort by{" "}
                  <select
                    value={sort}
                    onChange={(event) =>
                      filter(
                        "sort",
                        event.target.value === "featured"
                          ? ""
                          : event.target.value,
                      )
                    }
                  >
                    <option value="featured">Available first</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </label>
                {(search ||
                  category !== "All" ||
                  inStockOnly ||
                  sort !== "featured") && (
                  <button type="button" onClick={() => setParams({})}>
                    Clear filters
                  </button>
                )}
              </div>
              {loading ? (
                <div className="fm-store-loading" role="status">
                  <StoreIcon name="bag" size={30} />
                  Loading your market…
                </div>
              ) : productError ? (
                <div className="fm-store-error" role="alert">
                  {productError}{" "}
                  <button
                    type="button"
                    onClick={() => setReload((value) => value + 1)}
                  >
                    Try again
                  </button>
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="fm-store-empty">
                  <StoreIcon name="search" size={34} />
                  <h3>No products found</h3>
                  <p>
                    Try another search or category, or turn off In stock only.
                  </p>
                  <button
                    className="fm-store-button"
                    type="button"
                    onClick={() => setParams({})}
                  >
                    Show all products
                  </button>
                </div>
              ) : (
                <div className="fm-store-grid">
                  {visibleProducts.map((item) => {
                    const stock = Number(item.StockQuantity);
                    const quantity =
                      quantities.get(Number(item.InventoryID)) || 0;
                    const soldOut = stock <= 0;
                    const atLimit = quantity >= stock;
                    return (
                      <article
                        className={`fm-store-product${soldOut ? " fm-store-sold-out" : ""}`}
                        key={item.InventoryID}
                      >
                        <div className="fm-store-photo-wrap">
                          <ProductPhoto
                            id={item.InventoryID}
                            url={item.ImageURL}
                            name={item.InventoryName}
                            className="fm-store-photo"
                          />
                          {quantity > 0 && (
                            <span className="fm-in-cart">
                              {quantity} in cart
                            </span>
                          )}
                        </div>
                        <div className="fm-store-product-info">
                          <span className="fm-store-product-category">
                            {item.CategoryName || "Groceries"}
                          </span>
                          <h3>{item.InventoryName}</h3>
                          <div className="fm-store-product-price">
                            {money(item.Price)}
                          </div>
                          <p
                            className={`fm-store-stock${soldOut ? " fm-store-stock-empty" : ""}`}
                          >
                            {soldOut
                              ? "Out of stock"
                              : stock <= 5
                                ? `Only ${stock} left`
                                : "In stock"}
                          </p>
                          <button
                            className="fm-store-button fm-store-add"
                            type="button"
                            aria-label={`${soldOut ? "Unavailable" : atLimit ? "Stock limit reached for" : "Add"} ${item.InventoryName}`}
                            disabled={
                              loading ||
                              updating ||
                              soldOut ||
                              atLimit ||
                              (isSignedIn && !cartId)
                            }
                            onClick={() =>
                              isSignedIn
                                ? addItem(item.InventoryID)
                                : setShowSignIn(true)
                            }
                          >
                            {!soldOut && !atLimit && (
                              <StoreIcon name="cart" size={18} />
                            )}
                            {soldOut
                              ? "Unavailable"
                              : atLimit
                                ? "Stock limit reached"
                                : "Add"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
          <StorefrontCart
            products={products}
            productsLoaded={!loading && !productError}
          />
        </div>
        <footer className="fm-store-footer">
          <Link to="/browse">
            <StoreIcon name="leaf" size={20} /> FreshMart
          </Link>
          <span>A little fresh inspiration for every day.</span>
          <Link to="/savings">
            Explore savings <StoreIcon name="arrow" size={16} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
