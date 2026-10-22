import { useState } from "react";
import AddProductModal from "../components/AddProductModal";
import "../css/EmployeeDashboard.css";

function EmployeeDashboard() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  return (
    <div className="employee-dashboard">
      <h1 className="employee-dashboard-title">Employee Dashboard</h1>

      <div className="employee-dashboard-btns">
        <button className="employee-dashboard-btn">All Transactions</button>
      </div>

      <div className="emplyee-product-table">
        <h2 className="inventory-table-header">Inventory</h2>
        <button
          className="employee-add-product"
          onClick={() => setShowAddProduct(true)}
        >
          Add Product
        </button>
      </div>
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}
    </div>
  );
}

export default EmployeeDashboard;
