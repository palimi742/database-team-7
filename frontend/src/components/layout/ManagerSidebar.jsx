import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logoutStaff } from "../../api.js";
import "../../css/layout/ManagerSidebar.css";

function ManagerSidebar() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  async function handleLogout() {
    setSigningOut(true);
    setError("");
    try {
      await logoutStaff();
      navigate("/manager/login", { replace: true });
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <div className="manager-sidebar">
      <h2>Freshmart</h2>
      <p>Manager</p>

      <ul>
        <li>
          <Link to="/manager">Dashboard</Link>
        </li>
        <li>
          <Link to="/manager/products">Products</Link>
        </li>
        <li>
          <Link to="/manager-coupon-sales">Coupons & Sales</Link>
        </li>
        <li>
          <Link to="/manager/returns">Returns</Link>
        </li>
        <li>
          <Link to="/manager/reports/employee-workload">
            Employee Workload Report
          </Link>
        </li>
        <li>
          <Link to="/manager/reports/customer-loyalty">
            Customer Loyalty and Rewards Report
          </Link>
        </li>
        <li>
          <Link to="/manager/reports/sales-performance">
            Sales Performance Report
          </Link>
        </li>
      </ul>
      {error && <p role="alert">{error}</p>}
      <button className="manager-logout" type="button" onClick={handleLogout} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Logout"}
      </button>
    </div>
  );
}

export default ManagerSidebar;
