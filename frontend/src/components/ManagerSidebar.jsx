import { Link } from "react-router-dom";
import "../css/ManagerSidebar.css"

function ManagerSidebar() {
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
          <Link to="/manager/reports/employee-workload">Employee Workload Report</Link>
        </li>
        <li>
          <Link to="/manager/reports/customer-loyalty">Customer Loyalty and Rewards Report</Link>
        </li>
        <li>
          <Link to="/manager/reports/sales-performance">Sales Performance Report</Link>
        </li>
      </ul>
    </div>
  );
}

export default ManagerSidebar;
