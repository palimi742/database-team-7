import "./css/App.css";

import { Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import CustomerLogin from "./pages/Customer-Login";
import CustomerSignup from "./pages/Customer-Signup";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} /> 
      </Routes>
    </>
  );
}

export default App;
