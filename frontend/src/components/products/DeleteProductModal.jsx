import "../../css/products/ProductModal.css";
import { useState } from "react";

function DeleteProductModal({ product, onClose, onSaved }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);

    try {
      const res = await fetch(`/api/products/${product.InventoryID}/archive`, {
        method: "PATCH",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Archive unavailable. Make sure the backend is up to date.",
        );
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <div className="modal-overlay">
      <div
        className="product-modal product-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        aria-describedby="delete-product-description"
      >
        <h2 id="delete-product-title">Archive product?</h2>
        <p id="delete-product-description">
          <strong>{product.InventoryName}</strong> will move to Archived.
        </p>
        {error && (
          <p className="product-save-notice product-save-error" role="alert">
            {error}
          </p>
        )}
        <div className="product-modal-actions">
          <button type="button" onClick={onClose} disabled={deleting} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className="product-delete-confirm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Archiving…" : "Archive product"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteProductModal;
