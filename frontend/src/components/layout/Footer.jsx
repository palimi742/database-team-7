import { Link } from "react-router-dom";
import "../../css/layout/Footer.css";

function Footer() {
  return (
    <footer className="login-footer">
      <nav aria-label="Staff login">
      <Link to="/employee/login">Employee Login</Link>
      <span className="footer-divider" aria-hidden="true">|</span>
      <Link to="/manager/login">Manager Login</Link>
      </nav>
    </footer>
  );
}

export default Footer;
