import { useEffect, useRef } from "react";

export default function StockAvailabilityDialog({ items, updating, onAdjust, onBack }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="checkout-stock-alert" aria-labelledby="stock-alert-title"
      onCancel={(event) => { event.preventDefault(); if (!updating) onBack(); }}>
      <h2 id="stock-alert-title">Not enough stock</h2>
      <p>Your order hasn’t been placed. Update these items to continue.</p>
      {items.map((item) => (
        <div className="checkout-stock-item" key={item.productId}>
          <strong>{item.name}</strong>
          <p>You requested {item.requested}. {item.available > 0
            ? `Only ${item.available} are available.`
            : "This item is no longer available."}</p>
          <button type="button" disabled={updating} onClick={() => onAdjust(item)}>
            {item.available > 0 ? `Update quantity to ${item.available}` : "Remove item"}
          </button>
        </div>
      ))}
      <button type="button" className="secondary" disabled={updating} onClick={onBack}>Back to cart</button>
    </dialog>
  );
}
