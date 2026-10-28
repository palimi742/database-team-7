import "./css/App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StaffLogin from "./pages/StaffLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Signup from "./pages/Signup";
import Browse from "./pages/Browse";
import Loyalty from "./pages/Loyalty";
import Transactions from "./pages/Transactions";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerProducts from "./pages/ManagerProducts";
import EmployeeWorkloadReport from "./pages/EmployeeWorkloadReport";
import CustomerLoyaltyReport from "./pages/CustomerLoyaltyReport";
import SalesPerformanceReport from "./pages/SalesPerformanceReport";

import ManagerPromotions from "./pages/ManagerPromotions";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route
        path="/employee/login"
        element={<StaffLogin key="employee" loginType="employee" />}
      />
      <Route
        path="/admin/login"
        element={<StaffLogin key="admin" loginType="admin" />}
      />
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/loyalty" element={<Loyalty />} />
      <Route path="/manager" element={<ManagerDashboard />} />
      <Route path="/manager-coupon-sales" element={<ManagerPromotions />} />
      <Route path="/manager/products" element={<ManagerProducts />} />
      <Route
        path="/manager/reports/employee-workload"
        element={<EmployeeWorkloadReport />}
      />
      <Route
        path="/manager/reports/customer-loyalty"
        element={<CustomerLoyaltyReport />}
      />
      <Route
        path="/manager/reports/sales-performance"
        element={<SalesPerformanceReport />}
      />
    </Routes>
  );
}
export default App;
