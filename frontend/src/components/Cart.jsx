import "../css/Cart.css";

function Cart({ items, total, onRemove, onEmpty }) {
  return (
    <aside id="cart">
      <h2>Your Cart</h2>
      <div id="cartdetail">
        {items.length === 0 && <p>Your cart is empty.</p>}
        {items.map((item, index) => (
          <div className="cart-row" key={`${item.InventoryID}-${index}`}>
            <div>
              <strong>{item.InventoryName}</strong>
              <p>${Number(item.Price).toFixed(2)}</p>
            </div>
            <div className="controls">
              <button onClick={() => onRemove(index)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <p className="total">Total: ${total.toFixed(2)}</p>
      <button
        className="secondary"
        onClick={onEmpty}
        disabled={items.length === 0}
      >
        Empty Cart
      </button>
    </aside>
  );
}

export default Cart;
