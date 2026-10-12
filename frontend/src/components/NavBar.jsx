import { Link } from "react-router-dom";

import shoppingCartSVG from "../assets/shopping-cart.svg";
import receiptSVG from "../assets/receipt.svg";
import "../css/NavBar.css";

function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/my-orders" className="orders-link">
        My orders <img className="receipt-svg" src={receiptSVG} alt="" />
      </Link>
      <Link className="home-link" to="/">
        Local Groceries
      </Link>
      <div className="navbar-right">
        <Link to="/customer-login" className="login-link">Log in</Link>
        <Link to="/cart" className="cart-link" aria-label="Shopping Cart">
          <img className="shopping-cart" src={shoppingCartSVG} alt="" />
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
