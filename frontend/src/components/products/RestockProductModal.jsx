import { useEffect, useRef, useState } from "react";
import { managerFetch } from "../../api.js";

export default function RestockProductModal({ product, onClose, onSaved }) {
  const dialog = useRef(null);
  const savingRef = useRef(false);
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const amount = Number(quantity);
  const valid = Number.isInteger(amount) && amount > 0 && amount <= 2147483647 - Number(product.StockQuantity);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!valid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await managerFetch(`/api/products/${product.InventoryID}/restock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: amount }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The restock service is unavailable. Restart the backend and try again.");
      }
      if (!response.ok) throw new Error(data.message || "Unable to restock this product.");
    } catch (err) {
      setError(err.message);
      savingRef.current = false;
      setSaving(false);
      return;
    }
    // Close after a successful receipt so a list refresh cannot invite resubmission.
    onClose();
    await onSaved();
  }

  return (
    <dialog ref={dialog} className="restock-product-modal" aria-labelledby="restock-title"
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
      <h2 id="restock-title">Restock {product.InventoryName}</h2>
      <p>Current stock: <strong>{product.StockQuantity}</strong></p>
      <form onSubmit={submit}>
        <label htmlFor="restock-quantity">Units to add</label>
        <input id="restock-quantity" type="number" min="1" step="1"
          onWheel={(event) => event.currentTarget.blur()}
          max={2147483647 - Number(product.StockQuantity)} required
          value={quantity} disabled={saving} onChange={(event) => setQuantity(event.target.value)} />
        <p>Stock after restocking: <strong>{valid ? Number(product.StockQuantity) + amount : product.StockQuantity}</strong></p>
        <p className="restock-hint">Enter how many new units you are adding, not the total stock.</p>
        {error && <p role="alert" className="product-error">{error}</p>}
        <div className="restock-actions">
          <button type="button" disabled={saving} onClick={onClose}>Cancel</button>
          <button type="submit" className="restock-button" disabled={saving || !valid}>
            {saving ? "Saving…" : "Confirm restock"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
