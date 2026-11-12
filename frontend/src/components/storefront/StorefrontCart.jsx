import { Link } from "react-router-dom";
import { money } from "../../api.js";
import { useShop } from "../../context/ShopContext.jsx";
import ProductPhoto from "./ProductPhoto";
import StoreIcon from "./StoreIcon";

export default function StorefrontCart({ products, productsLoaded }) {
  const { cart, cartId, isSignedIn, updating, setQuantity, removeItem, clearCart, cartCount, error } = useShop();
  const catalog = new Map(products.map((product) => [Number(product.InventoryID), product]));
  const busy = updating || (isSignedIn && !cartId);
  return <aside className="fm-store-cart" aria-labelledby="fm-cart-title">
    <div className="fm-cart-heading"><h2 id="fm-cart-title">Your cart</h2><span>{cartCount} {cartCount === 1 ? "item" : "items"}</span></div>
    {isSignedIn && !cartId && <p className="fm-cart-note">{error ? "Your cart is unavailable. Please reload to try again." : "Connecting to your cart…"}</p>}
    <div className="fm-cart-items">{cart.items.length ? cart.items.map((item) => {
      const product = catalog.get(Number(item.productId));
      const available = Number(item.isActive) === 1 && Number(item.stock) > 0 && (!productsLoaded || Boolean(product));
      const stock = Math.min(Number(item.stock) || 0, product ? Number(product.StockQuantity) : Infinity);
      const maximum = Math.max(Number(item.quantity), stock);
      return <article className="fm-cart-item" key={item.productId}>
        <ProductPhoto id={item.productId} url={product?.ImageURL} name={item.name} className="fm-cart-photo" />
        <div className="fm-cart-item-info"><h3>{item.name}</h3><small>{money(item.price)} each</small>
          <div className="fm-cart-quantity"><button type="button" disabled={busy} aria-label={`Decrease ${item.name}`}
            onClick={() => setQuantity(item.productId, Number(item.quantity) - 1)}>−</button>
            <input key={`${item.productId}:${item.quantity}`} type="number" min="0" max={maximum} step="1" defaultValue={item.quantity}
              aria-label={`Quantity for ${item.name}`} disabled={busy} onBlur={(event) => {
                const value = Number(event.target.value);
                if (event.target.value.trim() !== "" && Number.isSafeInteger(value) && value >= 0 && value <= maximum) {
                  if (value !== Number(item.quantity)) setQuantity(item.productId, value);
                } else event.target.value = item.quantity;
              }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
            <button type="button" disabled={busy || !available || Number(item.quantity) >= stock}
              aria-label={`Increase ${item.name}`} onClick={() => setQuantity(item.productId, Number(item.quantity) + 1)}>+</button></div>
          {(!available || Number(item.quantity) > stock) && <p className="fm-cart-warning">Stock changed. Review quantity before checkout.</p>}
        </div>
        <div className="fm-cart-item-end"><strong>{money(item.lineTotal)}</strong><button className="fm-remove" type="button"
          disabled={busy} aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.productId)}><StoreIcon name="trash" size={17} /></button></div>
      </article>;
    }) : <div className="fm-cart-empty"><StoreIcon name="bag" size={38} /><p>A little fresh inspiration?</p><small>Add your favorites to start your cart.</small>
      {!isSignedIn && <Link to="/login">Sign in to shop →</Link>}</div>}</div>
    <div className="fm-cart-footer"><div className="fm-cart-subtotal"><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></div>
      <p className="fm-cart-note">Delivery fee and eligible savings shown at checkout.</p>
      {cart.items.length && !busy ? <Link className="fm-store-button fm-cart-review" to="/cart">Review cart <StoreIcon name="arrow" size={20} /></Link>
        : <button className="fm-store-button fm-cart-review" type="button" disabled>{updating ? "Updating cart…" : "Review cart"}<StoreIcon name="arrow" size={20} /></button>}
      {cart.items.length > 0 && <button className="fm-cart-clear" type="button" disabled={busy} onClick={clearCart}>Empty cart</button>}
    </div>
  </aside>;
}