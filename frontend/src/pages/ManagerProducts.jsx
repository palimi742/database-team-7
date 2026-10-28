import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import DeleteProductModal from "../components/DeleteProductModal";
import InsertProductModal from "../components/InsertProductModal";
import EditProductModal from "../components/EditProductModal";
import "../css/ManagerDashboard.css";

function ManagerProducts() {
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  async function loadProducts() {
    setError("");
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (!res.ok) {
        throw new Error("failed to load products");
      }
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function restoreProduct(product) {
    setError("");
    try {
      const res = await fetch(`/api/products/${product.InventoryID}/restore`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openModal(type, product = null) {
    setSelectedProduct(product);
    setActiveModal(type);
  }
  function closeModal() {
    setActiveModal(null);
    setSelectedProduct(null);
  }

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-main-dashboard">
        <h1>Products</h1>
        <button type="button" onClick={() => openModal("insert")}>
          Add Product
        </button>

        {loading && <p>Loading products...</p>}
        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.InventoryID}>
                  <td>{product.SKU}</td>
                  <td>{product.InventoryName}</td>
                  <td>${Number(product.Price).toFixed(2)}</td>
                  <td>{product.IsActive ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openModal("edit", product)}
                    >
                      Edit
                    </button>
                    {product.IsActive ? (
                      <button
                        type="button"
                        onClick={() => openModal("delete", product)}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restoreProduct(product)}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={5}>No products to display</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {activeModal === "delete" && (
          <DeleteProductModal
            product={selectedProduct}
            onClose={closeModal}
            onSaved={loadProducts}
          />
        )}
        {activeModal === "insert" && (
          <InsertProductModal onClose={closeModal} onSaved={loadProducts} />
        )}
        {activeModal === "edit" && (
          <EditProductModal
            product={selectedProduct}
            onClose={closeModal}
            onSaved={loadProducts}
          />
        )}
      </div>
    </div>
  );
}

export default ManagerProducts;
