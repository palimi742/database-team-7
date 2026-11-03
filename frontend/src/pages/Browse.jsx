import "../css/App.css";
import "../css/Product.css";
import "../css/Coupon.css";
import Cart from "../components/Cart";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useShop } from "../context/ShopContext.jsx";
import { useNavigate } from "react-router-dom";

function Browse() {
  const {
    cartId: cartID,
    cart: sharedCart,
    addItem,
    removeItem,
    clearCart,
    error: cartError,
  } = useShop();
  const navigate = useNavigate();
  const cart = sharedCart.items.map((item) => ({
    InventoryID: item.productId,
    InventoryName: item.name,
    Price: item.price,
    Quantity: item.quantity,
  }));
  const [products, setProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [clippedCoupons, setClippedCoupons] = useState([]);
  const [clippedCouponDetails, setClippedCouponDetails] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  useEffect(() => {
    async function loadCoupons() {
      try {
        const response = await fetch("/api/coupons");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load coupons.");
        }

        setCoupons(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadCoupons();
  }, []);

  useEffect(() => {
    async function loadClippedCoupons() {
      try {
        const customer = JSON.parse(localStorage.getItem("customer"));

        if (!customer) {
          return;
        }

        const response = await fetch(
          `/api/coupons/clipped/${customer.CustomerID}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load clipped coupons.");
        }

        setClippedCouponDetails(data);
        setClippedCoupons(data.map((coupon) => Number(coupon.CouponID)));
      } catch (err) {
        setError(err.message);
      }
    }

    loadClippedCoupons();
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

  async function clipCoupon(couponID) {
    try {
      const customer = JSON.parse(localStorage.getItem("customer"));

      if (!customer) {
        alert("Please log in to clip coupons.");
        return;
      }

      const response = await fetch("/api/coupons/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerID: customer.CustomerID,
          couponID: couponID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to clip coupon.");
      }

      setClippedCoupons((previous) => [...previous, Number(couponID)]);

      const clippedCoupon = coupons.find(
        (coupon) => Number(coupon.CouponID) === Number(couponID),
      );

      if (clippedCoupon) {
        setClippedCouponDetails((previous) => [clippedCoupon, ...previous]);
      }

      alert(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="browse-page">
      <Navbar />

      <div className="browse-container">
        <h1>Hello!</h1>
        <p>Find everything you need for your groceries</p>

        <div className="coupons-container">
          <h2>Available Coupons</h2>

          {coupons.length === 0 ? (
            <p>No active coupons right now</p>
          ) : (
            <div className="coupon-grid">
              {coupons.map((coupon) => (
                <div className="coupon-card" key={coupon.CouponID}>
                  <h3>{coupon.CouponName}</h3>
                  <p>${Number(coupon.DiscountAmount).toFixed(2)} off</p>

                  <button
                    onClick={() => clipCoupon(coupon.CouponID)}
                    disabled={clippedCoupons.includes(Number(coupon.CouponID))}
                  >
                    {clippedCoupons.includes(Number(coupon.CouponID))
                      ? "Clipped!"
                      : "Clip Coupon"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="coupon-container">
          <h2>My Clipped Coupons</h2>

          {clippedCouponDetails.length === 0 ? (
            <p>You haven't clipped any coupons yet</p>
          ) : (
            <div className="coupon-grid">
              {clippedCouponDetails.map((coupon) => (
                <div className="coupon-card" key={coupon.CouponID}>
                  <h3>{coupon.CouponName}</h3>
                  <p>${Number(coupon.DiscountAmount).toFixed(2)} off</p>
                  <p>
                    Clipped on:{" "}
                    {new Date(coupon.ClippedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

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

        <div className="product-grid">
          {filteredProducts.map((product) => {
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

                <button onClick={() => addToCart(product)} disabled={!cartID}>
                  Add to cart
                </button>
              </div>
            );
          })}
        </div>

        <Cart
          items={cart}
          total={subtotal}
          onRemove={removefromCart}
          onEmpty={emptyCart}
        />

        <button
          className="checkout-button"
          disabled={cart.length === 0}
          onClick={() => {
            navigate("/cart");
          }}
        >
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
}

export default Browse;
