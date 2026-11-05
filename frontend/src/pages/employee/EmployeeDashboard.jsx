import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logoutStaff } from "../../api.js";
import "../../css/customer/Home.css";

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  let employee = null;
  try {
    employee = JSON.parse(localStorage.getItem("employee"));
  } catch {
    return <Navigate to="/staff/login" replace />;
  }
  if (!employee) {
    return <Navigate to="/staff/login" replace />;
  }

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await logoutStaff();
      navigate("/staff/login", { replace: true });
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <Link className="home-brand" to="/">
          FreshMart
        </Link>
        <button className="home-button" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign Out"}
        </button>
      </header>
      <main className="staff-main">
        {error && <p role="alert">{error}</p>}
        <section className="staff-card">
          <h1>Employee Dashboard</h1>
          <p>Welcome, {employee.FirstName}.</p>
          <p>Role: {employee.EmployeeRole}</p>
          <Link to="/employee/fulfillment">
            View delivery and curbside orders
          </Link>
        </section>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
