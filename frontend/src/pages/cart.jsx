import { useNavigate } from 'react-router-dom';
import { money } from '../api';
import { useShop } from '../ShopContext.jsx';

export default function Cart() {
  const { cart, setQuantity, removeItem, clearCart } = useShop();
  const navigate = useNavigate();

  return (
    <main className="page">
      <div className="panel">
        <h2>Your Cart</h2>
        {cart.items.length === 0 && <p>Your cart is empty.</p>}

        {cart.items.map(item => (
          <div className="cart-row" key={item.productId}>
            <div>
              <strong>{item.name}</strong><br />
              {money(item.price)} x {item.quantity} = {money(item.lineTotal)}
            </div>
            <div className="controls">
              <button onClick={() => setQuantity(item.productId, item.quantity - 1)}>-</button>
              <button onClick={() => setQuantity(item.productId, item.quantity + 1)}>+</button>
              <button className="secondary" onClick={() => removeItem(item.productId)}>x</button>
            </div>
          </div>
        ))}

        <p className="total">Subtotal: {money(cart.subtotal)}</p>
        <button disabled={cart.items.length === 0} onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </button>
        <button className="secondary" onClick={() => navigate('/')}>Continue Shopping</button>
        <button className="secondary" onClick={clearCart}>Empty Cart</button>
      </div>
    </main>
  );
}
