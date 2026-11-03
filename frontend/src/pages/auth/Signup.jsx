import "./CustomerSignup.css";

import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import PasswordInput from "../../components/auth/PasswordInput";

function CustomerSignup() {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/customers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to submit the form.");
        return;
      }
      alert(data.message);
      navigate("/customer-login");
    } catch {
      alert("Unable to reach the backend. Check that it is running and the database is configured.");
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
            <input placeholder="John" id="firstName" name="firstName" type="text" required></input>
          </div>

          <div className="name-field">
            <label htmlFor="lastName">Last Name</label>
            <input placeholder="Doe" id="lastName" name="lastName" type="text" required></input>
          </div>
        </div>

        <label className="single-row-labels" htmlFor="phoneNumber">Phone Number</label>
        <input placeholder="555-123-4567" id="phoneNumber" name="phoneNumber" type="tel" required></input>

        <label className="single-row-labels" htmlFor="username">Username</label>
        <input placeholder="johnDoe972" id="username" name="username" type="text" required></input>

        <label className="single-row-labels" htmlFor="password">Password</label>
        <PasswordInput autoComplete="new-password" />

        <label className="single-row-labels" htmlFor="address">Address</label>
        <input id="address" name="customerAddress" type="text" placeholder="123 main street" required></input>

        <button className="signup-btn" type="submit">
          Sign up
        </button>
        <p>Already have an account? <Link to="/customer-login">Log in</Link></p>
      </form>
    </main>
    </>
  );
}

export default CustomerSignup;
