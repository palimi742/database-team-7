import { Link } from "react-router-dom";
import RestockProductModal from "../../components/products/RestockProductModal.jsx";
import { managerFetch } from "../../api.js";
import { useEffect, useRef, useState } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import DeleteProductModal from "../../components/products/DeleteProductModal";
import InsertProductModal from "../../components/products/InsertProductModal";
import EditCategoryModal from "../../components/products/EditCategoryModal";
import AddCategoryModal from "../../components/products/AddCategoryModal";
import EditProductModal from "../../components/products/EditProductModal";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/ManagerProducts.css";

function ManagerProducts() {
  const imageDialog = useRef(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [notice, setNotice] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadProducts() {
    setError("");
    try {
      const res = await managerFetch("/api/manager/products");
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
      const res = await managerFetch(
        `/api/products/${product.InventoryID}/${product.ArchivedAt ? "unarchive" : "restore"}`,
        {
          method: "PATCH",
        },
      );
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
    fetch("/api/categories")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load categories.");
        const rows = await response.json();
        setCategories(rows);
      })
      .catch((error) => setError(error.message));
  }, []);

  function openModal(type, product = null) {
    setSelectedProduct(product);
    setActiveModal(type);
  }
  function closeModal() {
    setActiveModal(null);
    setSelectedProduct(null);
  }

  const searchInput = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.InventoryName.toLowerCase().includes(searchInput) ||
      product.SKU.toLowerCase().includes(searchInput);

    const matchesCategory =
      categoryFilter === "all" || String(product.CategoryID) === categoryFilter;

    const isActive = Number(product.IsActive) === 1;

    const matchesStatus =
      statusFilter === "archived"
        ? Boolean(product.ArchivedAt)
        : !product.ArchivedAt &&
          (statusFilter === "all" ||
            (statusFilter === "active" ? isActive : !isActive));

    const stock = Number(product.StockQuantity);
    const low = stock > 0 && stock <= Number(product.ReorderThreshold);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "out" && stock === 0) ||
      (stockFilter === "low" && low) ||
      (stockFilter === "available" && stock > 0);
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(
    startIndex,
    startIndex + pageSize,
  );

  function renderPagination(position) {
    return (
      <div className="product-pagination">
        <label htmlFor={`products-per-page-${position}`}>
          Products per page{" "}
          <select
            id={`products-per-page-${position}`}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </label>
        <span aria-live="polite">
          Showing {filteredProducts.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + pageSize, filteredProducts.length)} of{" "}
          {filteredProducts.length} products
        </span>
        <nav aria-label={`Product pages ${position}`}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-page manager-products">
        <div className="products-heading">
          <div>
            <h1>Products</h1>
            <p>Manage your catalog and inventory.</p>
            <div role="status">{notice}</div>
          </div>
          <div className="products-heading-actions">
            <Link to="/manager/restock-requests">Manage restock requests</Link>
            <button type="button" onClick={() => openModal("edit-category")}>
              Edit category
            </button>
            <button type="button" onClick={() => openModal("category")}>
              + Add category
            </button>
            <button type="button" onClick={() => openModal("insert")}>
              + Add product
            </button>
          </div>
        </div>
        <div className="category-filters" aria-label="Product categories">
          {[
            { id: "all", name: "All" },
            ...categories.map((category) => ({
              id: String(category.CategoryID),
              name: category.CategoryName,
            })),
          ].map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryFilter === category.id}
              onClick={() => {
                setCategoryFilter(category.id);
                setPage(1);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="products-toolbar">
          <div className="product-search">
            <label htmlFor="product-search">Search Product</label>
            <input
              id="product-search"
              type="search"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="product-filters">
            <div>
              <label htmlFor="product-status">Status</label>
              <select
                id="product-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label htmlFor="product-stock">Stock</label>
              <select
                id="product-stock"
                value={stockFilter}
                onChange={(event) => {
                  setStockFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All stock</option>
                <option value="available">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          </div>
        </div>
        {loading && <p>Loading products...</p>}
        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <>
            <div className="product-table">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th aria-label="Product actions" />
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.InventoryID}>
                      <td>{product.SKU}</td>
                      <td>{product.InventoryName}</td>
                      <td>
                        {product.ImageURL ? (
                          <button
                            type="button"
                            className="product-thumbnail-button"
                            aria-label={`Enlarge image of ${product.InventoryName}`}
                            onClick={() => {
                              setPreviewProduct(product);
                              imageDialog.current.showModal();
                            }}
                          >
                            <img
                              className="product-thumbnail"
                              src={product.ImageURL}
                              alt=""
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          "No image"
                        )}
                      </td>
                      <td>{product.CategoryName}</td>
                      <td>${Number(product.Price).toFixed(2)}</td>
                      <td
                        className={
                          Number(product.StockQuantity) === 0
                            ? "stock-out"
                            : Number(product.StockQuantity) <=
                                Number(product.ReorderThreshold)
                              ? "stock-low"
                              : ""
                        }
                      >
                        <strong>{product.StockQuantity}</strong>
                        {Number(product.StockQuantity) === 0 ? (
                          <small>Out of stock</small>
                        ) : Number(product.StockQuantity) <=
                          Number(product.ReorderThreshold) ? (
                          <small>Low stock</small>
                        ) : null}
                        <span className="product-stock-target">
                          Target: {product.RestockTargetQuantity ?? "Not set"}
                        </span>
                      </td>
                      <td>
                        {product.ArchivedAt ? (
                          <span className="product-status product-status-archived">
                            Archived
                          </span>
                        ) : Number(product.IsActive) === 1 ? (
                          <span className="product-status product-status-active">
                            Active
                          </span>
                        ) : (
                          <span className="product-status product-status-inactive">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="product-row-actions">
                        {!product.ArchivedAt &&
                          Number(product.IsActive) === 1 && (
                            <button
                              type="button"
                              className="restock-button"
                              onClick={() => openModal("restock", product)}
                            >
                              Restock
                            </button>
                          )}
                        {!product.ArchivedAt && (
                          <>
                            <button
                              type="button"
                              onClick={() => openModal("edit", product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              popoverTarget={`product-actions-${product.InventoryID}`}
                              aria-label={`More actions for ${product.InventoryName}`}
                            >
                              More
                            </button>
                            <div
                              id={`product-actions-${product.InventoryID}`}
                              className="product-more-popover"
                              popover="auto"
                            >
                              <button
                                type="button"
                                className="delete-product-button"
                                onClick={(event) => {
                                  event.currentTarget.parentElement.hidePopover();
                                  openModal("delete", product);
                                }}
                              >
                                Archive
                              </button>
                            </div>
                          </>
                        )}
                        {(product.ArchivedAt ||
                          Number(product.IsActive) === 0) && (
                          <button
                            type="button"
                            onClick={() => restoreProduct(product)}
                          >
                            {product.ArchivedAt
                              ? "Restore to inactive"
                              : "Restore"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        No products match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination("bottom")}
          </>
        )}
        <dialog
          ref={imageDialog}
          className="product-image-dialog"
          aria-labelledby="catalog-image-title"
          onClose={() => setPreviewProduct(null)}
        >
          <div className="product-image-dialog-header">
            <h3 id="catalog-image-title">{previewProduct?.InventoryName}</h3>
            <button type="button" onClick={() => imageDialog.current.close()}>
              Close
            </button>
          </div>
          {previewProduct && (
            <img
              src={previewProduct.ImageURL}
              alt={previewProduct.InventoryName}
            />
          )}
        </dialog>
        {activeModal === "restock" && (
          <RestockProductModal
            product={selectedProduct}
            onClose={closeModal}
            onSaved={loadProducts}
          />
        )}
        {activeModal === "delete" && (
          <DeleteProductModal
            product={selectedProduct}
            onClose={closeModal}
            onSaved={loadProducts}
          />
        )}
        {activeModal === "edit-category" && (
          <EditCategoryModal
            categories={categories}
            onClose={closeModal}
            onSaved={(category, deleted) => {
              setCategories((current) =>
                current
                  .filter((item) => item.CategoryID !== category.CategoryID)
                  .concat(deleted ? [] : [category])
                  .sort((a, b) => a.CategoryName.localeCompare(b.CategoryName)),
              );
              if (deleted && categoryFilter === String(category.CategoryID)) {
                setCategoryFilter("all");
              }
              setNotice(deleted ? "Category deleted." : "Category updated.");
              closeModal();
              if (!deleted) loadProducts();
            }}
          />
        )}
        {activeModal === "category" && (
          <AddCategoryModal
            onClose={closeModal}
            onSaved={(category) => {
              setCategories((current) =>
                [...current, category].sort((a, b) =>
                  a.CategoryName.localeCompare(b.CategoryName),
                ),
              );
              setNotice(`Category added · ${category.CategoryName}`);
              closeModal();
            }}
          />
        )}
        {activeModal === "insert" && (
          <InsertProductModal
            onClose={closeModal}
            onSaved={async (sku) => {
              setNotice(`Product added · SKU ${sku}`);
              await loadProducts();
            }}
          />
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
