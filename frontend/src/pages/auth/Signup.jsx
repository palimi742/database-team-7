import "../../css/auth/CustomerSignup.css";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";

function CustomerSignup() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/customers/signup", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          data.message || "Unable to create your account. Please try again.",
        );
        return;
      }
      navigate("/login", { replace: true, state: { accountCreated: true } });
    } catch (error) {
      setError(
        error.name === "TimeoutError"
          ? "Signup is taking too long. Try signing in before submitting again."
          : "Unable to connect. Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <form className="signup-form" onSubmit={handleSubmit}>
          <h1 className="signup-heading">Customer Signup</h1>

          <div className="names-row">
            <div className="name-field">
              <label htmlFor="firstName">First Name</label>
              <input
                placeholder="John"
                id="firstName"
                name="firstName"
                type="text"
                required
              ></input>
            </div>

            <div className="name-field">
              <label htmlFor="lastName">Last Name</label>
              <input
                placeholder="Doe"
                id="lastName"
                name="lastName"
                type="text"
                required
              ></input>
            </div>
          </div>

          <label className="single-row-labels" htmlFor="phoneNumber">
            Phone Number
          </label>
          <input
            placeholder="555 123 4567"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            pattern="[ \x2D]*(?:[0-9][ \x2D]*){1,10}"
            title="Enter up to 10 digits. Spaces and dashes are allowed."
            required
          ></input>

          <label className="single-row-labels" htmlFor="username">
            Username
          </label>
          <input
            placeholder="johnDoe972"
            id="username"
            name="username"
            type="text"
            required
          ></input>

          <label className="single-row-labels" htmlFor="password">
            Password
          </label>
          <PasswordInput autoComplete="new-password" />

          <label className="single-row-labels" htmlFor="address">
            Street address (optional)
          </label>
          <input
            id="address"
            name="customerAddress"
            type="text"
            placeholder="123 main street"
          ></input>

          <label htmlFor="zipCode">ZIP code (optional)</label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            autoComplete="postal-code"
            placeholder="77008"
            pattern="[0-9]{5}(-[0-9]{4})?"
            maxLength={10}
            title="Enter 5 digits or ZIP+4, such as 77008 or 77008-1234"
          />

          <p>Your account includes free loyalty program membership.</p>
          {error && (
            <p className="signup-error" role="alert">
              {error}
            </p>
          )}
          <button className="signup-btn" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </button>
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  );
}

export default CustomerSignup;
