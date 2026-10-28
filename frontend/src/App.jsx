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
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import Home from "./pages/home";
import OrderDetail from "./pages/orderdetail";
import Orders from "./pages/orders";
import Payment from "./pages/payment";
import Receipt from "./pages/receipt";
import ReturnRequest from "./pages/return_request";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
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
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/home" element={<Home />} />
      <Route path="/orderdetail" element={<OrderDetail />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/receipt" element={<Receipt />} />
      <Route path="/return-request" element={<ReturnRequest />} />
    </Routes>
  );
}
export default App;
