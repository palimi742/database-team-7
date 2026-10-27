import "../css/ProductModal.css";
import { useEffect, useState } from "react";

function InsertProductModal({ onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }
        setCategories(data);
      } catch (err) {
        setCategoryError(err.message);
      }
    }
    loadCategories();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const product = Object.fromEntries(formData);
    setSaveError("");
    setSaving(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to add product");
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
        <h2>Add Product</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="insert-sku">SKU</label>
            <input id="insert-sku" name="sku" required />
          </div>
          <div>
            <label htmlFor="insert-name">Name</label>
            <input id="insert-name" name="name" required />
          </div>
          <div>
            <label htmlFor="insert-category">Category</label>
            <select id="insert-category" name="categoryID" required>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.CategoryID} value={category.CategoryID}>
                  {category.CategoryName}
                </option>
              ))}
            </select>
            {categoryError && <p>{categoryError}</p>}
          </div>
          <div>
            <label htmlFor="insert-price">Price</label>
            <input
              id="insert-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="insert-stock">Stock Quantity</label>
            <input
              id="insert-stock"
              name="stockQuantity"
              type="number"
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="insert-threshold">Reorder Threshold</label>
            <input
              id="insert-threshold"
              name="reorderThreshold"
              type="number"
              min="0"
              required
            />
          </div>
          {saveError && <p>{saveError}</p>}

          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default InsertProductModal;
