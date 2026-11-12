import "../../css/customer/QuantityInput.css";
import { Link } from "react-router-dom";
import { money } from "../../api.js";
import { useShop } from "../../context/ShopContext.jsx";
import Navbar from "../../components/layout/Navbar";
import "../../css/customer/CartPage.css";

export default function CartPage() {
  const { cart, setQuantity, removeItem, clearCart, error, cartId, updating } =
    useShop();
  const itemCount = cart.items.reduce(
    (count, item) => count + Number(item.quantity),
    0,
  );

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-page-container">
        <Link to="/browse" className="cart-page-back">
          Continue shopping
        </Link>
        <div className="cart-page-heading">
          <h1>Your cart</h1>
          <span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        {error && <p className="cart-page-message">{error}</p>}
        {!cartId && !error && (
          <p className="cart-page-message">
            <Link to="/login">Sign in</Link> to load your cart.
          </p>
        )}

        {cart.items.length === 0 ? (
          <div className="cart-page-empty">
            <h2>Your cart is empty</h2>
            <p>Find your favorites and start filling your cart.</p>
            <Link to="/browse" className="cart-page-primary">
              Shop groceries
            </Link>
          </div>
        ) : (
          <div className="cart-page-layout">
            <div className="cart-page-items">
              <div className="cart-page-columns">
                <span>Item</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              {cart.items.map((item) => (
                <div className="cart-page-row" key={item.productId}>
                  <div className="cart-page-product">
                    <h2>{item.name}</h2>
                    <p>{money(item.price)} each</p>
                    <button
                      className="cart-page-text-button"
                      disabled={updating}
                      onClick={() => removeItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="cart-page-quantity">
                    <button
                      aria-label={`Decrease quantity for ${item.name}`}
                      disabled={updating}
                      onClick={() =>
                        setQuantity(item.productId, Number(item.quantity) - 1)
                      }
                    >
                      -
                    </button>
                    <input
                      key={`${item.productId}-${item.quantity}`}
                      aria-label={`Quantity for ${item.name}`}
                      className="quantity-input"
                      type="number" min="0" step="1"
                      defaultValue={item.quantity} disabled={updating}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (event.target.value.trim() !== "" && Number.isSafeInteger(value) && value >= 0) {
                          if (value !== Number(item.quantity)) setQuantity(item.productId, value);
                        } else event.target.value = item.quantity;
                      }}
                      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                    />
                    <button
                      disabled={updating}
                      aria-label={`Increase quantity for ${item.name}`}
                      onClick={() =>
                        setQuantity(item.productId, Number(item.quantity) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <strong className="cart-page-line-total">
                    {money(item.lineTotal)}
                  </strong>
                </div>
              ))}
              <button
                className="cart-page-text-button cart-page-clear"
                disabled={updating}
                onClick={clearCart}
              >
                Empty cart
              </button>
            </div>

            <div className="cart-page-summary">
              <h2>Order summary</h2>
              <div className="cart-page-subtotal">
                <span>Subtotal</span>
                <strong>{money(cart.subtotal)}</strong>
              </div>
              <p>Free delivery on orders of $50 or more. Delivery is $5.99 below $50.</p>
              {updating ? (
                <button className="cart-page-primary" disabled>
                  Updating cart…
                </button>
              ) : (
                <Link to="/checkout" className="cart-page-primary">
                  Proceed to checkout
                </Link>
              )}
              <Link to="/browse" className="cart-page-back">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
