import "../../css/products/ProductModal.css";
import { useEffect, useState } from "react";

function InsertProductModal({ onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldError, setFieldError] = useState(null);

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
    setFieldError(null);
    if (
      Number(product.restockTargetQuantity) <= Number(product.reorderThreshold)
    ) {
      setSaveError(
        "Restock target must be greater than the reorder threshold.",
      );
      return;
    }
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
        if (["sku", "name"].includes(data.field)) {
          setFieldError({ field: data.field, message: data.message });
        }
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
        <form onSubmit={handleSubmit} inert={saveError ? true : undefined}>
          <div>
            <label htmlFor="insert-sku">SKU</label>
            <input
              id="insert-sku"
              name="sku"
              required
              aria-invalid={fieldError?.field === "sku"}
              aria-describedby={
                fieldError?.field === "sku" ? "insert-sku-error" : undefined
              }
            />
            {fieldError?.field === "sku" && (
              <p id="insert-sku-error" className="product-field-error">
                {fieldError.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="insert-name">Name</label>
            <input
              id="insert-name"
              name="name"
              required
              aria-invalid={fieldError?.field === "name"}
              aria-describedby={
                fieldError?.field === "name" ? "insert-name-error" : undefined
              }
            />
            {fieldError?.field === "name" && (
              <p id="insert-name-error" className="product-field-error">
                {fieldError.message}
              </p>
            )}
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
              onWheel={(event) => event.currentTarget.blur()}
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
              onWheel={(event) => event.currentTarget.blur()}
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
              onWheel={(event) => event.currentTarget.blur()}
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="insert-restock-target">Restock Target</label>
            <input
              id="insert-restock-target"
              name="restockTargetQuantity"
              type="number"
              onWheel={(event) => event.currentTarget.blur()}
              min="1"
              step="1"
              required
            />
          </div>

          <div className="product-modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
        {saveError && (
          <div className="product-error-modal">
            <div className="product-error-text" role="alert">
              <h2 className="product-error-title">
                Product could not be added
              </h2>
              <p className="product-error-message">{saveError}</p>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setSaveError("");
                }}
              >
                Back to form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default InsertProductModal;
