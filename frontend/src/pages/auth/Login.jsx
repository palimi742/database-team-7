import "../../css/auth/CustomerLogin.css";
import { useEffect, useRef, useState } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";

function CustomerLogin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState(() => searchParams.get("notice") === "account-inactive"
    ? { title: "Account is marked as inactive", message: "Your account has been deactivated and you’re now signed out." }
    : searchParams.get("notice") === "session-ended"
      ? { title: "Please sign in again", message: "Your session has ended or your account is inactive. You’re now signed out." }
      : null);
  const dialog = useRef(null);
  useEffect(() => {
    if (notice && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [notice]);

  function dismissNotice() {
    setNotice(null);
    if (searchParams.has("notice")) {
      const params = new URLSearchParams(searchParams);
      params.delete("notice");
      setSearchParams(params, { replace: true });
    }
  }

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
        if (data.code === "ACCOUNT_INACTIVE") {
          sessionStorage.removeItem("customer");
        }
        setNotice({
          title: data.code === "ACCOUNT_INACTIVE" ? "Account is marked as inactive" : "Unable to sign in",
          message: data.message || "Unable to submit the form.",
        });
        return;
      }
      sessionStorage.setItem("customer", JSON.stringify(data.customer));
      navigate("/browse");
    } catch {
      setNotice({ title: "Unable to sign in", message: "We couldn’t connect. Please try again shortly." });
    }
  }

  return (
    <>
      <Navbar />
      {notice && (
        <dialog ref={dialog} className="customer-login-dialog"
          aria-labelledby="customer-notice-title" aria-describedby="customer-notice-message"
          onCancel={event => { event.preventDefault(); dismissNotice(); }}>
          <h2 id="customer-notice-title">{notice.title}</h2>
          <p id="customer-notice-message">{notice.message}</p>
          <button type="button" className="login-btn" autoFocus onClick={dismissNotice}>OK</button>
        </dialog>
      )}
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
