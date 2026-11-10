import { useState } from "react";
import { managerFetch } from "../../api.js";
import "../../css/products/ProductModal.css";

export default function AddCategoryModal({ onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const response = await managerFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to add category.");
      onSaved(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="product-modal">
        <h2>Add Category</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="category-name">Category Name</label>
            <input id="category-name" name="name" maxLength={100} required />
          </div>
          <div>
            <label htmlFor="category-prefix">SKU Prefix</label>
            <input
              id="category-prefix"
              name="prefix"
              placeholder="FRZ"
              maxLength={3}
              pattern="[A-Za-z]{3}"
              aria-describedby="category-prefix-help"
              required
            />
            <small id="category-prefix-help">Use three letters. For example, FRZ starts at FRZ-001.</small>
          </div>
          {error && <p className="product-field-error" role="alert">{error}</p>}
          <div className="product-modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
