import { Link } from "react-router-dom";
import "../css/CustomerLogin.css";

function EmployeeLogin() {
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <main>
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Employee Login</h1>

        <label htmlFor="employee-username">Username</label>
        <input
          id="employee-username"
          name="username"
          type="text"
          autoComplete="username"
          required
        />

        <label htmlFor="employee-password">Password</label>
        <input
          id="employee-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <button className="login-btn" type="submit">
          Log in
        </button>

        <Link className="employee-home-link" to="/">
          Return to Home
        </Link>
      </form>
    </main>
  );
}

export default EmployeeLogin;