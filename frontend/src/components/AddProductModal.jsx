import { useState, useEffect } from "react";

import "../css/AddProductModal.css";

function AddProductModal({ onClose }) {
  const [categories, setCategories] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    //form data
    const form = e.currentTarget;
    const formData = new FormData(form);
    const product = Object.fromEntries(formData);
    // console.log(product)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        throw new Error("Failed to send product");
      }

      const data = await res.json();
      console.log(data.message);
      form.reset()
    } catch (err) {
      console.log(err.message);
    }
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.log(err.message);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="add-product-overlay">
      <div className="add-product-modal">
        <h2 id="add-product-heading">Add Product</h2>
        <form className="add-product-form" onSubmit={handleSubmit}>
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            name="InventoryName"
            type="text"
            placeholder="Whole Milk"
            required
          />

          <label htmlFor="product-sku">SKU</label>
          <input
            id="product-sku"
            name="SKU"
            type="text"
            placeholder="DAIRY-001"
            required
          />

          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            name="CategoryID"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.CategoryID} value={category.CategoryID}>
                {category.CategoryName}
              </option>
            ))}
          </select>

          <label htmlFor="product-price">Price $</label>
          <input
            id="product-price"
            name="Price"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            required
          />

          <label htmlFor="product-stock">Stock Quantity</label>
          <input
            id="product-stock"
            name="StockQuantity"
            type="text"
            inputMode="numeric"
            pattern="[0-9]+"
            placeholder="0"
            required
          />

          <label htmlFor="product-reorder">Reorder Threshold</label>
          <input
            id="product-reorder"
            name="ReorderThreshold"
            type="text"
            inputMode="numeric"
            pattern="[0-9]+"
            placeholder="0"
            required
          />

          <div className="add-product-actions">
            <button
              className="add-product-cancel"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="add-product-save" type="submit">
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductModal;
