import "../css/CustomerLogin.css";

import { Link } from "react-router-dom";

function CustomerLogin() {
  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <main>
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Customer Login</h1>
        <label className="username-label" htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="JohnDoe123"
          required
        ></input>
        <label className="password-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required></input>
        <button className="login-btn" type="submit">Login</button>
        <p className="create-account">
          Don't have an account? <Link to="/create-account" className="createAccountLink">Create one</Link>
        </p>
      </form>
    </main>
  );
}

export default CustomerLogin;
