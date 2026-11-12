import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext.jsx";
import StoreIcon from "../storefront/StoreIcon";
import "../../css/layout/NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, updating } = useShop();
  let customer = null;
  try { customer = JSON.parse(sessionStorage.getItem("customer")); } catch { /* Guest browsing. */ }
  const query = new URLSearchParams(location.search).get("q") || "";
  const shoppingPage = ["/", "/home", "/browse"].includes(location.pathname);
  function search(event) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") || "").trim();
    const params = new URLSearchParams(shoppingPage ? location.search : "");
    if (value) params.set("q", value); else params.delete("q");
    const suffix = params.toString();
    navigate(`/browse${suffix ? `?${suffix}` : ""}`);
  }
  return <header className="fm-nav">
    <div className="fm-nav-inner"><div className="fm-nav-top">
      <Link to="/browse" className="fm-nav-brand" aria-label="FreshMart home"><span className="fm-nav-leaf"><StoreIcon name="leaf" size={34} /></span>FreshMart</Link>
      <nav className="fm-nav-links" aria-label="Customer navigation">
        <NavLink className={shoppingPage ? "fm-nav-link fm-nav-current" : "fm-nav-link"} to="/browse" aria-current={shoppingPage ? "page" : undefined}>Shop</NavLink>
        <NavLink className={({ isActive }) => `fm-nav-link${isActive ? " fm-nav-current" : ""}`} to="/savings">Savings</NavLink>
        <NavLink className={({ isActive }) => `fm-nav-link${isActive ? " fm-nav-current" : ""}`} to="/my-orders">My orders</NavLink>
        <Link className="fm-nav-link fm-nav-returns" to="/my-orders?tab=returns&page=1">Returns</Link>
      </nav>
      <div className="fm-nav-actions"><Link className="fm-nav-account" to={customer ? "/account" : "/login"}>
        <StoreIcon name="user" /><span>{customer ? "Account" : "Sign in"}</span></Link>
        <Link className="fm-nav-cart" to="/cart" aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`} aria-busy={updating}>
          <StoreIcon name="cart" size={26} /><span className="fm-nav-count">{cartCount > 99 ? "99+" : cartCount}</span></Link></div>
    </div>
    <form className="fm-nav-search" role="search" onSubmit={search}>
      <StoreIcon name="search" size={24} /><input key={`${location.pathname}:${query}`} name="q" defaultValue={query} type="search"
        maxLength={100} aria-label="Search groceries" placeholder="Search for groceries, categories, or SKU…" />
      <button type="submit">Search</button>
    </form></div>
  </header>;
}