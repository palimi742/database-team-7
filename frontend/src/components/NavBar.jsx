import { Link } from "react-router-dom"

function NavBar(){
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Grocery Store</Link>
            </div>
        </nav>
    )
}

export default NavBar