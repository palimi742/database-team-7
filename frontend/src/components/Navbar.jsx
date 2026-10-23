import '../css/App.css';
import {Routes, Route, Link} from "react-router-dom"


function Navbar(){
  return(
    <nav>
      <Link to="/">Freshmart</Link>
      <Link to="/transactions">Transactions</Link>
      <Link to="/loyalty">Loyalty Program</Link>
    </nav>
  );
}
export default Navbar;
