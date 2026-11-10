import "../../css/products/ProductModal.css";
import { useEffect, useRef, useState } from "react";
import { managerFetch } from "../../api.js";

function EditProductModal({ product, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [savedImageURL, setSavedImageURL] = useState(product.ImageURL);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const imageDialog = useRef(null);
  const imageInput = useRef(null);
  const imageURL = previewURL || savedImageURL;

  const [categories, setCategories] = useState(null);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Unable to load categories.");
        if (active) setCategories(data);
      } catch (err) {
        if (active) setCategoryError(err.message);
      }
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedImage) return;
    const url = URL.createObjectURL(selectedImage);
    setPreviewURL(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.delete("image");
    const productUpdates = Object.fromEntries(formData);

    setSaveError("");
    setSaveStatus("");
    setSaving(true);

    try {
      const res = await managerFetch(`/api/products/${product.InventoryID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productUpdates),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || "Unable to save changes. Please try again.",
        );
      }

      if (!data) {
        throw new Error(
          "The server did not confirm the save. Reopen the product to check its current details.",
        );
      }

      setSaveStatus(
        selectedImage
          ? "Product details saved. The selected image is still unsaved."
          : "Product details saved.",
      );
      await onSaved();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload() {
    if (!selectedImage || saving) return;

    setSaveError("");
    setSaveStatus("");

    if (selectedImage.size === 0 || selectedImage.size > 4_000_000) {
      setSaveError("Choose a nonempty image up to 4 MB.");
      return;
    }

    setSaving("image");
    try {
      const res = await managerFetch(
        `/api/products/${product.InventoryID}/image`,
        {
          method: "PUT",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        },
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.imageURL) {
        throw new Error(data?.message || "Unable to upload the image.");
      }

      setSavedImageURL(`${data.imageURL}?v=${Date.now()}`);
      setSelectedImage(null);
      setPreviewURL(null);
      imageInput.current.value = "";
      setSaveStatus("Image uploaded.");
      await onSaved();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="product-modal edit-product-modal">
        <h2>Edit Product</h2>

        <form onSubmit={handleSubmit} onChange={() => setSaveStatus("")}>
          <div className="edit-product-fields">
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
                <select
                  id="edit-category"
                  name="categoryID"
                  defaultValue={product.CategoryID}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category.CategoryID}
                      value={category.CategoryID}
                    >
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

            <div className="product-image-section">
              <div className="product-image-heading">
                <label htmlFor="edit-image">Product Image</label>
                <span
                  className={
                    savedImageURL
                      ? "product-image-status is-uploaded"
                      : "product-image-status"
                  }
                >
                  {savedImageURL ? "Uploaded" : "No image"}
                </span>
              </div>
              {imageURL && (
                <button
                  type="button"
                  className="product-image-preview"
                  aria-label="View larger product image"
                  onClick={() => imageDialog.current.showModal()}
                >
                  <img src={imageURL} alt={product.InventoryName} width="96" />
                  <span>View larger</span>
                </button>
              )}
              <input
                ref={imageInput}
                id="edit-image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="edit-image-help"
                disabled={saving}
                onChange={(event) => {
                  setSelectedImage(event.target.files[0] ?? null);
                  setPreviewURL(null);
                  setSaveError("");
                }}
              />
              <small id="edit-image-help">
                Choose a JPEG, PNG, or WebP up to 4 MB.
              </small>
            </div>
          </div>

          {selectedImage && (
            <div className="product-save-notice">
              <p>Unsaved image: {selectedImage.name}</p>
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={Boolean(saving)}
              >
                {saving === "image" ? "Uploading image…" : "Upload Image"}
              </button>
            </div>
          )}

          {saveError && (
            <p className="product-save-notice product-save-error" role="alert">
              <strong>Save failed.</strong> {saveError}
            </p>
          )}
          {(saving || saveStatus) && (
            <p
              className={`product-save-notice ${saving ? "" : "product-save-success"}`}
              role="status"
            >
              {saving === "image"
                ? "Uploading image…"
                : saving
                  ? "Saving product…"
                  : saveStatus}
            </p>
          )}

          <div className="product-modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>
              {saveStatus ? "Close" : "Cancel"}
            </button>

            <button type="submit" disabled={saving || !categories}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
        <dialog
          ref={imageDialog}
          className="product-image-dialog"
          aria-label={product.InventoryName}
        >
          <div className="product-image-dialog-header">
            <h3>{product.InventoryName}</h3>
            <button
              type="button"
              aria-label="Close image"
              onClick={() => imageDialog.current.close()}
            >
              ×
            </button>
          </div>
          {imageURL && <img src={imageURL} alt={product.InventoryName} />}
        </dialog>
      </div>
    </div>
  );
}

export default EditProductModal;
