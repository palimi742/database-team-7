import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PasswordInput from "../components/PasswordInput";
import "../css/CustomerLogin.css";
import "../css/StaffLogin.css";

function StaffLogin({ loginType = "employee" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, loginType }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }
      localStorage.setItem("employee", JSON.stringify(data.employee));
      if (data.employee.EmployeeRole.toLowerCase() === "manager") {
        navigate("/manager");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <form className="login-form staff-login-form" onSubmit={handleLogin}>
          <h1>{loginType === "admin" ? "Admin Login" : "Employee Login"}</h1>
          <p className="staff-login-description">Sign in with your staff account.</p>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" placeholder="Enter your username" autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <PasswordInput autoComplete="current-password" />
          {error && <p className="staff-login-error" role="alert">{error}</p>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="staff-login-back"><Link to="/customer-login">Back to customer login</Link></p>
        </form>
      </main>
    </>
  );
}

export default StaffLogin;
