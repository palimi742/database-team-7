import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import shoppingCartSVG from "../assets/shopping-cart.svg";
import receiptSVG from "../assets/receipt.svg";
import "../css/NavBar.css";

function NavBar() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customer"));
    } catch {
      return null;
    }
  });

  function logOut() {
    localStorage.removeItem("customer");
    setCustomer(null);
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/my-orders" className="orders-link">
        My orders <img className="receipt-svg" src={receiptSVG} alt="" />
      </Link>
      <Link className="home-link" to="/">
        FreshMart
      </Link>
      <div className="navbar-right">
        {customer ? (
          <>
            <span className="customer-name">Hi, {customer.FirstName || customer.Username}</span>
            <button className="login-link logout-button" type="button" onClick={logOut}>Log out</button>
          </>
        ) : (
          <Link to="/customer-login" className="login-link">Log in</Link>
        )}
        <Link to="/cart" className="cart-link" aria-label="Shopping Cart">
          <img className="shopping-cart" src={shoppingCartSVG} alt="" />
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
