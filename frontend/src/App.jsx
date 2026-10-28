import "./css/App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Browse from "./pages/Browse";
import Loyalty from "./pages/Loyalty";
import Transactions from "./pages/Transactions";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerProducts from "./pages/ManagerProducts";
import EmployeeWorkloadReport from "./pages/EmployeeWorkloadReport";
import CustomerLoyaltyReport from "./pages/CustomerLoyaltyReport";
import SalesPerformanceReport from "./pages/SalesPerformanceReport";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login key="customer" />} />
      <Route path="/employee/login" element={<Login key="employee" role="employee" />} />
      <Route path="/manager/login" element={<Login key="manager" role="manager" />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/loyalty" element={<Loyalty />} />
      <Route path="/manager" element={<ManagerDashboard />} />
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
