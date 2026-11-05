import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";
import "../../css/auth/CustomerLogin.css";
import "../../css/auth/StaffLogin.css";

function StaffLogin({ loginType = "employee" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notice = searchParams.get("notice");
  const showNotice = loginType === "admin" &&
    ["manager-required", "signin-required"].includes(notice);
  const noticeDialog = useRef(null);

  useEffect(() => {
    if (showNotice && noticeDialog.current && !noticeDialog.current.open) {
      noticeDialog.current.showModal();
    }
  }, [showNotice]);

  function dismissNotice() {
    const params = new URLSearchParams(searchParams);
    params.delete("notice");
    setSearchParams(params, { replace: true });
  }

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
      {showNotice && (
        <dialog ref={noticeDialog} className="staff-access-dialog"
          aria-labelledby="staff-access-title" aria-describedby="staff-access-description"
          onCancel={event => { event.preventDefault(); dismissNotice(); }}>
          <h2 id="staff-access-title">
            {notice === "manager-required" ? "Manager access required" : "Sign in required"}
          </h2>
          <p id="staff-access-description">
            {notice === "manager-required"
              ? "Please sign in with an active manager account to view this information."
              : "You’re signed out or your session has expired. Please sign in to continue."}
          </p>
          <button type="button" autoFocus onClick={dismissNotice}>Continue to sign in</button>
        </dialog>
      )}
      <main>
        <form className="login-form staff-login-form" onSubmit={handleLogin}>
          <h1>{loginType === "admin" ? "Manager Login" : "Employee Login"}</h1>
          <p className="staff-login-description">
            Sign in with your staff account.
          </p>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            placeholder="Enter your username"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password</label>
          <PasswordInput autoComplete="current-password" />
          {error && (
            <p className="staff-login-error" role="alert">
              {error}
            </p>
          )}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="staff-login-back">
            <Link to="/customer-login">Back to customer login</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default StaffLogin;
