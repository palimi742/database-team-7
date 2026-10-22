import "./css/App.css";

import { Routes, Route, useLocation } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import CustomerLogin from "./pages/Customer-Login";
import CustomerSignup from "./pages/Customer-Signup";
import EmployeeLogin from "./pages/Employee-Login";
import EmployeeDashboard from "./pages/EmployeeDasboard";

function App() {
  const location = useLocation();
  const isEmployeePage = location.pathname.startsWith("/employee/");
  const isEmployeeLogin = location.pathname === "/employee-login";
  const showCustomerNav = !isEmployeePage && !isEmployeeLogin;
  const showFooter = !isEmployeeLogin;
  return (
    <>
      {showCustomerNav && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      </Routes>
      {showFooter && <Footer isEmployeePage={isEmployeePage} />}
      {/*  */}
    </>
  );
}

export default App;
