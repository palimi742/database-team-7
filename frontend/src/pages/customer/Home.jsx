import "../../css/App.css";
import "../../css/customer/Product.css";
import "../../css/customer/Home.css";
import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext.jsx";
import { useNavigate } from "react-router-dom";

function Home() {
  const { addItem, cartId, error: cartError } = useShop();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState("");

  useEffect(() => {
    const controller = new AbortController(); // cancel request on prev btns
    async function loadProducts() {
      setLoading(true);
      setProductError("");

      const url =
        selectedCategory === "All"
          ? "/api/products"
          : `/api/products?categoryID=${selectedCategory}`;

      try {
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to load products");
        }
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setProductError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [selectedCategory]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Unable to load categories.");
        }

        setCategories(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadCategories();
  }, []);
  const filteredProducts = products.filter((product) =>
    product.InventoryName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="browse-page browse-container">
      <div className="category-section">
        <div className="category-buttons">
          <button
            className={
              selectedCategory === "All"
                ? "category-btn active"
                : "category-btn"
            }
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.CategoryID}
              className={
                selectedCategory === category.CategoryID
                  ? "category-btn active"
                  : "category-btn"
              }
              onClick={() => setSelectedCategory(category.CategoryID)}
            >
              {category.CategoryName}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      {cartError && <p role="alert">{cartError}</p>}
      {loading ? (
        <p role="status">Loading products...</p>
      ) : productError ? (
        <p role="alert">{productError}</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products match your search in this category.</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div className="product-card" key={product.InventoryID}>
              {product.ImageURL && <img className="product-card-image" src={product.ImageURL} alt={product.InventoryName} loading="lazy" />}
              <h3>{product.InventoryName}</h3>
              <p>${Number(product.Price).toFixed(2)}</p>
              <button
                onClick={() =>
                  cartId
                    ? addItem(product.InventoryID)
                    : navigate("/login")
                }
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;

