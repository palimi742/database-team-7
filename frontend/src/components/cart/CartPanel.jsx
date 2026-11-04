import "../../css/cart/CartPanel.css";

function CartPanel({
  items,
  total,
  updating = false,
  onQuantityChange,
  onRemove,
  onEmpty,
  onReview,
}) {
  const itemCount = items.reduce(
    (count, item) => count + Number(item.Quantity),
    0,
  );

  const money = (value) => `$${Number(value).toFixed(2)}`;

  return (
    <div id="cart">
      <div className="cart-panel-header">
        <h2>Your cart</h2>
        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="cart-panel-items">
        {items.length === 0 ? (
          <p className="cart-empty">
            Your cart is empty. Add something you love!
          </p>
        ) : (
          items.map((item, index) => (
            <div className="cart-panel-item" key={item.InventoryID}>
              <div className="cart-item-details">
                <h3>{item.InventoryName}</h3>
                <p>{money(item.Price)} each</p>

                <div className="cart-quantity">
                  <button
                    type="button"
                    disabled={updating || !onQuantityChange}
                    onClick={() =>
                      onQuantityChange(
                        item.InventoryID,
                        Number(item.Quantity) - 1,
                      )
                    }
                  >
                    −
                  </button>

                  <span>{item.Quantity}</span>

                  <button
                    type="button"
                    disabled={updating || !onQuantityChange}
                    onClick={() =>
                      onQuantityChange(
                        item.InventoryID,
                        Number(item.Quantity) + 1,
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-text-button"
                  disabled={updating}
                  onClick={() => onRemove(index)}
                >
                  Remove
                </button>
              </div>

              <strong className="cart-line-total">
                {money(Number(item.Price) * Number(item.Quantity))}
              </strong>
            </div>
          ))
        )}
      </div>

      <div className="cart-panel-footer">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <strong>{money(total)}</strong>
        </div>

        <p className="cart-note">
          Delivery and discounts calculated at checkout.
        </p>

        <button
          type="button"
          className="cart-review-button"
          disabled={updating || items.length === 0 || !onReview}
          onClick={onReview}
        >
          Review cart →
        </button>

        {items.length > 0 && (
          <button
            type="button"
            className="cart-text-button cart-empty-button"
            disabled={updating}
            onClick={onEmpty}
          >
            Empty cart
          </button>
        )}
      </div>
    </div>
  );
}

export default CartPanel;
