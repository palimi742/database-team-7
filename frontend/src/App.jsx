import "./css/App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
//import StaffLogin from "./pages/auth/StaffLogin";
import EmployeeHours from "./pages/employee/EmployeeHours";
import EmployeePlaceOrder from "./pages/employee/EmployeePlaceOrder";
import ManagerOrderIssues from "./pages/manager/ManagerOrderIssues";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeFulfillment from "./pages/employee/EmployeeFulfillment";
import Signup from "./pages/auth/Signup";
import Browse from "./pages/customer/Browse";
import Savings from "./pages/customer/Savings";
import Loyalty from "./pages/customer/Loyalty";
import Transactions from "./pages/customer/Transactions";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerRestockRequests from "./pages/manager/ManagerRestockRequests";
import ManagerProducts from "./pages/manager/ManagerProducts";
import EmployeeWorkloadReport from "./pages/manager/EmployeeWorkloadReport";
import CustomerLoyaltyReport from "./pages/manager/CustomerLoyaltyReport";
import SalesPerformanceReport from "./pages/manager/SalesPerformanceReport";
import ManagerReturns from "./pages/manager/ManagerReturns";
import ManagerPromotions from "./pages/manager/ManagerPromotions";
import ProtectedManagerRoute from "./components/auth/ProtectedManagerRoute";
import Home from "./pages/customer/Home";
import NavBar from "./components/layout/Navbar";

import Account from "./pages/customer/Account";
import CartPage from "./pages/customer/CartPage";
import Checkout from "./pages/customer/checkout";
import OrderDetails from "./pages/customer/OrderDetails";
import Orders from "./pages/customer/orders";
import Payment from "./pages/customer/payment";
import Receipt from "./pages/customer/receipt";
import ReturnRequest from "./pages/customer/return_request";
import EmployeeInventoryReport from "./pages/employee/EmployeeInventoryReport";
import EmployeeRestockRequests from "./pages/employee/EmployeeRestockRequests";
import EmployeeRecentOrders from "./pages/employee/EmployeeRecentOrders";

function App() {
  const { search } = useLocation();

  return (
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
          {["/customer-login", "/staff/login", "/employee/login", "/admin/login", "/manager/login"].map(path => (
            <Route key={path} path={path} element={<Navigate to={{ pathname: "/login", search }} replace />} />
          ))}
          <Route
            path="/employee/restock-requests"
            element={<EmployeeRestockRequests />}
          />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/recent-orders" element={<EmployeeRecentOrders />} />
                    <Route path="/employee/hours" element={<EmployeeHours />} />
          <Route path="/employee/place-order" element={<EmployeePlaceOrder />} />
          <Route path="/employee/inventory"
          element={<EmployeeInventoryReport />}
        />
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
                        <Route path="/manager/order-issues" element={<ManagerOrderIssues />} />
            <Route
  path="/manager/restock-requests"
  element={<ManagerRestockRequests />}
/>
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
  );
}
export default App;
