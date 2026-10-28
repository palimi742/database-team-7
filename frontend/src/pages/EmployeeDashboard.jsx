import { Link, Navigate, useNavigate } from "react-router-dom";
import "../css/Home.css";

function EmployeeDashboard() {
  const navigate = useNavigate();
  let employee = null;
  try {
    employee = JSON.parse(localStorage.getItem("employee"));
  } catch {
    return <Navigate to="/staff/login" replace />;
  }
  if (!employee) {
    return <Navigate to="/staff/login" replace />;
  }

  function signOut() {
    localStorage.removeItem("employee");
    navigate("/staff/login");
  }

  return (
    <div className="home-page">
      <header className="home-header"><Link className="home-brand" to="/">FreshMart</Link><button className="home-button" onClick={signOut}>Sign Out</button></header>
      <main className="staff-main"><section className="staff-card">
        <h1>Employee Dashboard</h1>
        <p>Welcome, {employee.FirstName}.</p>
        <p>Role: {employee.EmployeeRole}</p>
        <p>The delivery and curbside workspace has not been connected yet.</p>
      </section></main>
    </div>
  );
}

export default EmployeeDashboard;
