import home from "../../assets/admin-assets/home.svg";
import cube from "../../assets/admin-assets/cube.svg";
import coupon from "../../assets/admin-assets/coupon.svg";
import undo from "../../assets/admin-assets/undo.svg";
import employee_manage from "../../assets/admin-assets/employee-manage.svg";
import loyalty from "../../assets/admin-assets/loyalty.svg";
import finance_monitoring from "../../assets/admin-assets/finance-monitoring.svg";
import { NavLink, useNavigate } from "react-router-dom";
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
      navigate("/login", { replace: true });
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
          <NavLink to="/manager" end>
            <img src={home} alt="" />
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/products">
            <img src={cube} alt="" />
            Products
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager-coupon-sales">
            <img src={coupon} alt="" />
            Coupons & Sales
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/returns">
            <img src={undo} alt="" />
            Returns
          </NavLink>
        </li>
        <li className="manager-sidebar-section">Reports</li>
        <li>
          <NavLink to="/manager/reports/employee-workload">
            <img src={employee_manage} alt="" />
            Employee Workload
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/reports/customer-loyalty">
            <img src={loyalty} alt="" />
            Customer Loyalty & Rewards
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/reports/sales-performance">
            <img src={finance_monitoring} alt="" />
            Sales Performance
          </NavLink>
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
