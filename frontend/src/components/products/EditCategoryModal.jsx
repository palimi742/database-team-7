import { useState } from "react";
import { managerFetch } from "../../api.js";
import "../../css/products/ProductModal.css";

export default function EditCategoryModal({ categories, onClose, onSaved }) {
  const [id, setId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const category = categories.find((item) => String(item.CategoryID) === id);

  async function save(deleted) {
    if (!category || saving) return;
    setError("");
    setSaving(true);

    try {
      const response = await managerFetch(`/api/categories/${id}`, deleted
        ? { method: "DELETE" }
        : {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, prefix }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      onSaved(deleted ? category : data, deleted);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="product-modal">
        {confirmDelete ? (
          <>
            <h2>Delete {category.CategoryName}?</h2>
            <p>Only categories that have never issued a SKU and have no linked records can be deleted.</p>
            {error && <p className="product-field-error" role="alert">{error}</p>}
            <div className="product-modal-actions">
              <button type="button" autoFocus disabled={saving} onClick={() => {
                setError("");
                setConfirmDelete(false);
              }}>Back to edit</button>
              <button type="button" className="category-delete-button" disabled={saving} onClick={() => save(true)}>
                {saving ? "Deleting…" : "Delete Category"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Edit Category</h2>
            <form onSubmit={(event) => { event.preventDefault(); save(false); }}>
              <div>
                <label htmlFor="category-to-edit">Category</label>
                <select id="category-to-edit" value={id} disabled={saving}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setId(nextId);
                    const nextCategory = categories.find((item) => String(item.CategoryID) === nextId);
                    setName(nextCategory?.CategoryName ?? "");
                    setPrefix(nextCategory?.SKUPrefix ?? "");
                    setError("");
                  }}>
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item.CategoryID} value={item.CategoryID}>{item.CategoryName}</option>
                  ))}
                </select>
              </div>
              {category && (
                <>
                  <div>
                    <label htmlFor="edit-category-name">Category Name</label>
                    <input id="edit-category-name" value={name} maxLength={100} required
                      onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="edit-category-prefix">SKU Prefix</label>
                    <input id="edit-category-prefix" value={prefix} maxLength={3}
                      pattern="[A-Za-z]{3}" required
                      onChange={(event) => setPrefix(event.target.value.toUpperCase())} />
                    <small>Product SKU prefixes update too. Only unused categories can be deleted.</small>
                  </div>
                </>
              )}
              {error && <p className="product-field-error" role="alert">{error}</p>}
              <div className="product-modal-actions">
                <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="button" className="category-delete-button" onClick={() => { setError(""); setConfirmDelete(true); }} disabled={!category || saving}>Delete</button>
                <button type="submit" disabled={!category || saving}>Save Changes</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
