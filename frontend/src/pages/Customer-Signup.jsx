import "../css/CustomerSignup.css";

import { Link } from "react-router-dom";

function CustomerSignup() {
  function handleSubmit(e) {
    return
  }

  return (
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

        <label className="single-row-labels" htmlFor="email">Email</label>
        <input placeholder="JohnDoe@mail.com" id="email" name="email" type="email" required></input>

        <label className="single-row-labels" htmlFor="username">Username</label>
        <input placeholder="johnDoe972" id="username" name="username" type="text" required></input>

        <label className="single-row-labels" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required></input>
        <button className="signup-btn" type="submit">
          Sign up
        </button>
      </form>
    </main>
  );
}

export default CustomerSignup;
