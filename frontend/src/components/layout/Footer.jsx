import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <div className="login-footer">
      <Link to="/employee/login">Employee Login</Link>
      <Link to="/manager/login">Manager Login</Link>
    </div>
  );
}

export default Footer;
