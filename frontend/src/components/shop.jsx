import { useState, useEffect } from 'react';
import { api, money } from '../api';

export default function Shop({ cartId, cart, refreshCart, goTo }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/api/products').then(setProducts).catch(console.error);
  }, []);

  async function cartAction(fn) {
    try {
      await fn();
      await refreshCart();
    } catch (err) {
      alert(err.message);
    }
  }

  const add = (id) =>
    cartAction(() => api(`/api/cart/${cartId}/items`, 'POST', { productId: id, quantity: 1 }));
  const setQty = (id, qty) =>
    cartAction(() => api(`/api/cart/${cartId}/items/${id}`, 'PUT', { quantity: qty }));
  const remove = (id) =>
    cartAction(() => api(`/api/cart/${cartId}/items/${id}`, 'DELETE'));
  const clear = () =>
    cartAction(() => api(`/api/cart/${cartId}`, 'DELETE'));

  return (
    <main>
      <section>
        <h2>Products</h2>
        <div className="product-grid">
          {products.map(p => (
            <div className="product" key={p.id}>
              <h3>{p.name}</h3>
              <p className="note">{p.category}</p>
              <p className="price">{money(p.price)}</p>
              {p.stock > 0
                ? <button onClick={() => add(p.id)}>Add to Cart</button>
                : <em>Out of stock</em>}
            </div>
          ))}
        </div>
      </section>

      <aside id="cart">
        <h2>Your Cart</h2>
        {cart.items.length === 0 && <p>Your cart is empty.</p>}
        {cart.items.map(item => (
          <div className="cart-row" key={item.productId}>
            <div>
              <strong>{item.name}</strong><br />
              {money(item.price)} x {item.quantity} = {money(item.lineTotal)}
            </div>
            <div className="controls">
              <button onClick={() => setQty(item.productId, item.quantity - 1)}>-</button>
              <button onClick={() => setQty(item.productId, item.quantity + 1)}>+</button>
              <button className="secondary" onClick={() => remove(item.productId)}>x</button>
            </div>
          </div>
        ))}
        <p className="total">Subtotal: {money(cart.subtotal)}</p>
        <button disabled={cart.items.length === 0} onClick={() => goTo('checkout')}>
          Checkout
        </button>
        <button className="secondary" onClick={clear}>Empty Cart</button>
      </aside>
    </main>
  );
}
