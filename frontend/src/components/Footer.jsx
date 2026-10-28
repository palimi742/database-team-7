import { Link } from "react-router-dom";
import "../css/Home.css";

function Footer() {
  return (
    <footer className="login-footer">
      <Link to="/employee/login">Employee Login</Link>
      <span> | </span>
      <Link to="/admin/login">Admin Login</Link>
    </footer>
  );
}

export default Footer;
