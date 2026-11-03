import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

export function ShopProvider({ children }) {
  useLocation(); // Re-read the signed-in customer after navigation.
  let customer = null;
  try {
    customer = JSON.parse(localStorage.getItem("customer"));
  } catch {
    /* Signed out. */
  }
  const customerID = customer?.CustomerID;
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [error, setError] = useState("");
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    setCartId(null);
    setCart({ items: [], subtotal: 0 });
    setCheckoutInfo(null);
    setError("");
    if (customerID) {
      api("/api/cart", "POST", { customerID })
        .then(async ({ cartId: id }) => {
          const data = await api(`/api/cart/${id}`);
          if (active) {
            setCartId(id);
            setCart(data);
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
    }
    return () => {
      active = false;
    };
  }, [customerID]);

  const refreshCart = useCallback(async () => {
    if (!cartId) return;
    const data = await api(`/api/cart/${cartId}`);
    setCart(data);
  }, [cartId]);

  async function cartAction(path, method, body) {
    if (!cartId) {
      setError("Your cart is not ready. Please sign in or reload the page.");
      return;
    }
    setError("");
    try {
      await api(`/api/cart/${cartId}${path}`, method, body);
      await refreshCart();
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadProfile() {
    const me = await api("/api/shop-me");
    setProfile(me);
    return me;
  }

  return (
    <ShopContext.Provider
      value={{
        cartId,
        cart,
        error,
        refreshCart,
        profile,
        loadProfile,
        checkoutInfo,
        setCheckoutInfo,
        cartCount: cart.items.reduce((n, item) => n + Number(item.quantity), 0),
        addItem: (id) =>
          cartAction("/items", "POST", { productId: id, quantity: 1 }),
        setQuantity: (id, quantity) =>
          cartAction(`/items/${id}`, "PUT", { quantity }),
        removeItem: (id) => cartAction(`/items/${id}`, "DELETE"),
        clearCart: () => cartAction("", "DELETE"),
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
