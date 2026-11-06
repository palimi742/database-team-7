import "../../css/products/ProductModal.css";
import { useEffect, useState } from "react";

function EditProductModal({ product, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [categories, setCategories] = useState(null);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Unable to load categories.");
        if (active) setCategories(data);
      } catch (err) {
        if (active) setCategoryError(err.message);
      }
    }
    loadCategories();
    return () => { active = false; };
  }, []);

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

          <div>
            <label htmlFor="edit-category">Category</label>
            {categories ? (
              <select id="edit-category" name="categoryID" defaultValue={product.CategoryID} required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.CategoryID} value={category.CategoryID}>
                    {category.CategoryName}
                  </option>
                ))}
              </select>
            ) : (
              <p>{categoryError || "Loading categories…"}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-stock">Stock Quantity</label>
            <input
              id="edit-stock"
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              defaultValue={product.StockQuantity}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-threshold">Reorder Threshold</label>
            <input
              id="edit-threshold"
              name="reorderThreshold"
              type="number"
              min="0"
              step="1"
              defaultValue={product.ReorderThreshold}
              required
            />
          </div>

          {saveError && <p role="alert">{saveError}</p>}

          <div className="product-modal-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>

          <button type="submit" disabled={saving || !categories}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;
