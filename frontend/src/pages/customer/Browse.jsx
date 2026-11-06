import "../../css/App.css";
import "../../css/customer/Product.css";
import CartPanel from "../../components/cart/CartPanel";
import { useState, useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import { useShop } from "../../context/ShopContext.jsx";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

function Browse() {
  const {
    cartId: cartID,
    cart: sharedCart,
    addItem,
    removeItem,
    clearCart,
    setQuantity,
    updating,
    error: cartError,
  } = useShop();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const cart = sharedCart.items.map((item) => ({
    InventoryID: item.productId,
    InventoryName: item.name,
    Price: item.price,
    Quantity: item.quantity,
  }));

  const [products, setProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All",
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load products.");
        }

        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load categories.");
        }

        setCategories(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadSales() {
      try {
        const response = await fetch("/api/seasonal-sales");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load seasonal sales.");
        }

        setSeasonalProducts(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadSales();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.InventoryName.toLowerCase().includes(
      search.toLowerCase(),
    );

    const matchesCategory =
      selectedCategory === "All" ||
      Number(product.CategoryID) === Number(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce(
    (total, product) =>
      total + Number(product.Price) * Number(product.Quantity),
    0,
  );

  function getDiscount(product) {
    let discount = 0;

    for (const sale of seasonalProducts) {
      if (
        Number(sale.InventoryID) === Number(product.InventoryID) &&
        Number(sale.DiscountAmount) > discount
      ) {
        discount = Number(sale.DiscountAmount);
      }
    }

    return discount;
  }

  function addToCart(product) {
    return addItem(product.InventoryID);
  }

  function removefromCart(index) {
    return removeItem(cart[index].InventoryID);
  }

  function emptyCart() {
    return clearCart();
  }

  return (
    <div className="browse-page">
      <Navbar />

      <div className="browse-container">
        <h1>Hello!</h1>
        {location.state?.orderMessage && (
          <p className="order-success">{location.state.orderMessage}</p>
        )}
        <p>Find everything you need for your groceries</p>

        <input
          className="search-input"
          type="text"
          placeholder="Search for Groceries"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="category-section">
          <h2>Shop by Category</h2>

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
                  Number(selectedCategory) === Number(category.CategoryID)
                    ? "category-btn active"
                    : "category-btn"
                }
                onClick={() => setSelectedCategory(String(category.CategoryID))}
              >
                {category.CategoryName}
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
        {cartError && <p role="alert">{cartError}</p>}

        <div className="browse-shop-layout">
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const outOfStock = Number(product.StockQuantity) <= 0;
              const discount = getDiscount(product);
              const regularPrice = Number(product.Price);
              const salePrice = Math.max(regularPrice - discount, 0);

              return (
                <div className="product-card" key={product.InventoryID}>
                  <h3>{product.InventoryName}</h3>

                  {discount > 0 ? (
                    <>
                      <p>
                        <strong>${salePrice.toFixed(2)}</strong>{" "}
                        <del>${regularPrice.toFixed(2)}</del>
                      </p>
                      <p>Seasonal Sale!</p>
                    </>
                  ) : (
                    <p>${regularPrice.toFixed(2)}</p>
                  )}

                  {outOfStock && <p className="product-stock-empty">Out of stock</p>}
                  <button
                    onClick={() => addToCart(product)}
                    disabled={!cartID || updating || outOfStock}
                  >
                    {outOfStock ? "Unavailable" : "Add to cart"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="browse-cart-column">
            <CartPanel
              items={cart}
              total={subtotal}
              updating={updating}
              onQuantityChange={setQuantity}
              onRemove={removefromCart}
              onEmpty={emptyCart}
              onReview={() => navigate("/cart")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Browse;
