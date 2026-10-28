import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

export function ShopProvider({ children }) {
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [profile, setProfile] = useState(null);
  const [checkoutInfo, setCheckoutInfo] = useState(null); // choices carried from Checkout to Payment

  // On start: reuse the saved cart if it is still valid, otherwise make new one
  useEffect(() => {
    async function init() {
      let id = localStorage.getItem('cartToken');
      if (id) {
        try {
          await api(`/api/cart/${id}`);
        } catch (err) {
          if (err.status === 403 || err.status === 404) id = null;
          else throw err;
        }
      }
      if (!id) {
        const data = await api('/api/cart', 'POST');
        id = data.cartId;
        localStorage.setItem('cartToken', id);
      }
      setCartId(id);
    }
    init().catch(console.error);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!cartId) return;
    setCart(await api(`/api/cart/${cartId}`));
  }, [cartId]);

  useEffect(() => {
    refreshCart().catch(console.error);
  }, [refreshCart]);

  async function cartAction(fn) {
    try {
      await fn();
      await refreshCart();
    } catch (err) {
      alert(err.message);
    }
  }

  const addItem = (id) =>
    cartAction(() => api(`/api/cart/${cartId}/items`, 'POST', { productId: id, quantity: 1 }));
  const setQuantity = (id, qty) =>
    cartAction(() => api(`/api/cart/${cartId}/items/${id}`, 'PUT', { quantity: qty }));
  const removeItem = (id) =>
    cartAction(() => api(`/api/cart/${cartId}/items/${id}`, 'DELETE'));
  const clearCart = () =>
    cartAction(() => api(`/api/cart/${cartId}`, 'DELETE'));

  async function loadProfile() {
    const me = await api('/api/shop-me');
    setProfile(me);
    return me;
  }

  const cartCount = cart.items.reduce((n, i) => n + i.quantity, 0);

  if (!cartId) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <ShopContext.Provider value={{
      cartId, cart, cartCount, refreshCart,
      addItem, setQuantity, removeItem, clearCart,
      profile, loadProfile, checkoutInfo, setCheckoutInfo
    }}>
      {children}
    </ShopContext.Provider>
  );
}
