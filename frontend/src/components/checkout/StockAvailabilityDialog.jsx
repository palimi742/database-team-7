import { useEffect, useRef } from "react";

export default function StockAvailabilityDialog({
  items,
  updating,
  onAdjust,
  onBack,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="checkout-stock-alert"
      aria-labelledby="stock-alert-title"
      aria-describedby="stock-alert-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!updating) onBack();
      }}
    >
      <h2 id="stock-alert-title">Not enough stock</h2>
      <p id="stock-alert-description">
        Adjust the quantities below before placing your order.
      </p>
      {items.map((item) => (
        <div className="checkout-stock-item" key={item.productId}>
          <strong>{item.name}</strong>
          <p>
            Requested: <strong>{item.requested}</strong>.{" "}
            {item.available > 0 ? (
              <>
                Available: <strong>{item.available}</strong>.
              </>
            ) : (
              "This item is no longer available."
            )}
          </p>
          <button
            type="button"
            disabled={updating}
            onClick={() => onAdjust(item)}
          >
            {item.available > 0
              ? `Update quantity to ${item.available}`
              : "Remove item"}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={updating}
        onClick={onBack}
      >
        Back to cart
      </button>
    </dialog>
  );
}
