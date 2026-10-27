import { useState, useEffect } from 'react';
import { api, money } from '../api';
import { useShop } from '../ShopContext.jsx';

export default function Home() {
  const { addItem } = useShop();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/api/products').then(setProducts).catch(console.error);
  }, []);

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
                ? <button onClick={() => addItem(p.id)}>Add to Cart</button>
                : <em>Out of stock</em>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
