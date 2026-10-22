import { Link } from "react-router-dom";
import "../css/Footer.css"
function Footer({isEmployeePage}) {
  return (
    <footer className="footer">
        {isEmployeePage ? (
            <Link to="/employee-login">Log out</Link>
        ) : (
            <Link to="/employee-login">Employee Login</Link>
        )}
    </footer>
  );
}

export default Footer