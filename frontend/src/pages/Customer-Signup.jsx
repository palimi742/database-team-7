import "../css/CustomerSignup.css";

import { Link } from "react-router-dom";

function CustomerSignup() {
  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <main>
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Customer Signup</h1>
      </form>
    </main>
  );
}

export default CustomerSignup;
