import { Link } from "react-router-dom";

import shoppingCartSVG from "../../assets/shopping-cart.svg";
import accountSVG from "../../assets/account_circle.svg";
import receiptSVG from "../../assets/receipt.svg";
import "../../css/layout/NavBar.css";

function NavBar() {
  let customer = null;
  try {
    customer = JSON.parse(sessionStorage.getItem("customer"));
  } catch {
    customer = null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/my-orders" className="orders-link">
          My orders <img className="receipt-svg" src={receiptSVG} alt="" />
        </Link>
        <Link to="/savings" className="savings-link">
          Savings
        </Link>
        <Link to="/my-orders?tab=returns&page=1" className="savings-link">
          Returns
        </Link>
      </div>
      <Link className="home-link" to="/browse">
        FreshMart
      </Link>
      <div className="navbar-right">
        {customer ? (
          <Link to="/account" className="login-link account-link">
            <img className="account-svg" src={accountSVG} alt="" />
            My Account
          </Link>
        ) : (
          <Link to="/login" className="login-link">
            Log in
          </Link>
        )}
        <Link to="/cart" className="cart-link" aria-label="Shopping Cart">
          <img className="shopping-cart" src={shoppingCartSVG} alt="" />
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
