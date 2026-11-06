import "../../css/auth/CustomerSignup.css";

import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";

function CustomerSignup() {
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to create your account. Please try again.");
        return;
      }
      setCreated(true);
    } catch {
      setError("Unable to connect. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main>
        {created ? (
          <section className="signup-form signup-success" aria-labelledby="signup-success-heading">
            <div role="status">
              <h1 id="signup-success-heading" className="signup-heading">Your account is ready!</h1>
              <p>You’re automatically enrolled in Freshmart Rewards with 0 points. Log in to start shopping and earning rewards.</p>
            </div>
            <Link className="signup-btn" to="/customer-login">Continue to log in</Link>
          </section>
        ) : (
        <form className="signup-form" onSubmit={handleSubmit}>
          <h1 className="signup-heading">Customer Signup</h1>

          {error && <p className="signup-error" role="alert">{error}</p>}

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
            placeholder="555-123-4567"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
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
            Address
          </label>
          <input
            id="address"
            name="customerAddress"
            type="text"
            placeholder="123 main street"
            required
          ></input>

          <p>Your account includes free loyalty program membership.</p>
          <button className="signup-btn" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </button>
          <p>
            Already have an account? <Link to="/customer-login">Log in</Link>
          </p>
        </form>
        )}
      </main>
    </>
  );
}

export default CustomerSignup;
