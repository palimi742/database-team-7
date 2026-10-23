import './App.css'
import { useState, useEffect } from 'react';
import Navbar from './Navbar';

function Browse(){
  const[search, setSearch] = useState(""); 
  const[products, setProducts] = useState([])
  const [cart, setCart] = useState([]);
  useEffect(() => {
    fetch('http://localhost:3000/api/products')
    .then(response => response.json())
    .then(data => setProducts(data))

  }, []);
  const filteredProducts = products.filter((product) =>
    product.InventoryName.toLowerCase().includes(search.toLowerCase()))
  function addToCart(product) {
    setCart([...cart,product]);
  }
  function removefromCart(indexToRemove){
    setCart(prevItems => prevItems.filter((items, index) => index !== indexToRemove));
  }
  const subtotal = cart.reduce((total, product) => total + Number(product.Price), 0);
  return(
    <div>
      <Navbar/>
      <div className="browse-container">
        <h1>Hello!</h1>
        <p>Find everything you need for your groceries</p>
        <input
          type = "text"
          placeholder='Search for Groceries'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div className = "product-card" key={product.InventoryID}>
              <h3>{product.InventoryName}</h3>
              <p>${Number(product.Price).toFixed(2)}</p>
              <button onClick={() => addToCart(product)}
                >Add to cart
              </button>
            </div>
          ))}
         
        </div>
        <div className="cart-container">
          <h2>Your Cart</h2>

          <p>Items in cart: {cart.length}</p>

          {cart.map((product, index) => (
            <div key={`${product.InventoryID}-${index}`}>
              <p>{product.InventoryName} - ${Number(product.Price).toFixed(2)}</p>
              <button onClick={() => removefromCart(index)}>Remove</button>
            </div>
          ))}
          <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
        </div>
      </div>
    </div>
    
  );
}

export default Browse;
