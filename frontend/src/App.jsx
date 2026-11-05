import "./css/App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import StaffLogin from "./pages/auth/StaffLogin";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeFulfillment from "./pages/employee/EmployeeFulfillment";
import Signup from "./pages/auth/Signup";
import Browse from "./pages/customer/Browse";
import Savings from "./pages/customer/Savings";
import Loyalty from "./pages/customer/Loyalty";
import Transactions from "./pages/customer/Transactions";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerProducts from "./pages/manager/ManagerProducts";
import EmployeeWorkloadReport from "./pages/manager/EmployeeWorkloadReport";
import CustomerLoyaltyReport from "./pages/manager/CustomerLoyaltyReport";
import SalesPerformanceReport from "./pages/manager/SalesPerformanceReport";
import ManagerReturns from "./pages/manager/ManagerReturns";
import ManagerPromotions from "./pages/manager/ManagerPromotions";
import ProtectedManagerRoute from "./components/auth/ProtectedManagerRoute";
import Home from "./pages/customer/Home";
import NavBar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Account from "./pages/customer/Account";
import CartPage from "./pages/customer/CartPage";
import Checkout from "./pages/customer/checkout";
import OrderDetails from "./pages/customer/OrderDetails";
import Orders from "./pages/customer/orders";
import Payment from "./pages/customer/payment";
import Receipt from "./pages/customer/receipt";
import ReturnRequest from "./pages/customer/return_request";

function App() {
  const { pathname } = useLocation();
  const isManagerPage =
    pathname === "/manager" ||
    pathname.startsWith("/manager/") ||
    pathname === "/manager-coupon-sales";

  return (
    <>
      <div className="app-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <NavBar />
                <Home />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/customer-login" element={<Login />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route
            path="/employee/login"
            element={<StaffLogin key="employee" loginType="employee" />}
          />
          <Route
            path="/admin/login"
            element={<StaffLogin key="admin" loginType="admin" />}
          />
          <Route
            path="/manager/login"
            element={<StaffLogin key="manager" loginType="admin" />}
          />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route
            path="/employee/fulfillment"
            element={<EmployeeFulfillment />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/customer-signup" element={<Signup />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route element={<ProtectedManagerRoute />}>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route
              path="/manager/reports/customer-loyalty"
              element={<CustomerLoyaltyReport />}
            />
            <Route
              path="/manager/reports/sales-performance"
              element={<SalesPerformanceReport />}
            />
            <Route path="/manager/returns" element={<ManagerReturns />} />
            <Route
              path="/manager/reports/employee-workload"
              element={<EmployeeWorkloadReport />}
            />
            <Route path="/manager/products" element={<ManagerProducts />} />

            <Route
              path="/manager-coupon-sales"
              element={<ManagerPromotions />}
            />
          </Route>
          <Route path="/account" element={<Account />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/home"
            element={
              <>
                <NavBar />
                <Home />
              </>
            }
          />
          <Route path="/orderdetail" element={<OrderDetails />} />
          <Route path="/my-orders" element={<Orders />} />
          <Route path="/my-orders/:orderId" element={<OrderDetails />} />
          <Route
            path="/my-orders/:orderId/return"
            element={<ReturnRequest />}
          />
          <Route
            path="/my-orders/:orderId/return/:itemId"
            element={<ReturnRequest />}
          />
          <Route path="/payment" element={<Payment />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/receipt/:orderId" element={<Receipt />} />
          <Route path="/return-request" element={<ReturnRequest />} />
        </Routes>
      </div>
      {!isManagerPage && <Footer />}
    </>
  );
}
export default App;
