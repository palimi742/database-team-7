import "../../css/auth/CustomerLogin.css";

import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";

function CustomerLogin() {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to submit the form.");
        return;
      }
      sessionStorage.setItem("customer", JSON.stringify(data.customer));
      navigate("/browse");
    } catch {
      alert(
        "Unable to reach the backend. Check that it is running and the database is configured.",
      );
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Customer Login</h1>
          <label className="username-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="JohnDoe123"
            required
          ></input>
          <label className="password-label" htmlFor="password">
            Password
          </label>
          <PasswordInput autoComplete="current-password" />
          <button className="login-btn" type="submit">
            Login
          </button>
          <p className="create-account">
            Don't have an account?{" "}
            <Link to="/customer-signup" className="createAccountLink">
              Create one
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default CustomerLogin;
