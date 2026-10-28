import "../css/ProductModal.css";
import { useState } from "react";

function EditProductModal({ product, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const updatedProduct = Object.fromEntries(formData);

    setSaveError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/products/${product.InventoryID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }

      await onSaved();
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="product-modal">
        <h2>Edit Product</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="edit-sku">SKU</label>
            <input
              id="edit-sku"
              name="sku"
              defaultValue={product.SKU}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              name="name"
              defaultValue={product.InventoryName}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-price">Price</label>
            <input
              id="edit-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product.Price}
              required
            />
          </div>

          {saveError && <p>{saveError}</p>}

          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;
