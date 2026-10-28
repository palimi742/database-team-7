import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Home.css";

function StaffLogin({ loginType = "employee" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password, loginType: loginType }),
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
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>FreshMart POS.</h1>
        <h2>{loginType === "admin" ? "Admin Login" : "Employee Login"}</h2>
        <p>Sign in with your staff account.</p>
        <input aria-label="Username" placeholder="Enter your username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <input aria-label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      <button
        type="button"
        className="password-toggle"
        aria-pressed={showPassword}
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? "Hide password" : "Show password"}
      </button>
        {error && <p role="alert">{error}</p>}
        <button className="signin-btn" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        <p><Link to="/">Customer Login</Link></p>
      </form>
    </div>
  );
}

export default StaffLogin;
