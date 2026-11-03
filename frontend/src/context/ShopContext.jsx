import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

export function ShopProvider({ children }) {
  useLocation(); // Re-read the signed-in customer after navigation.
  let customer = null;
  try {
    customer = JSON.parse(sessionStorage.getItem("customer"));
  } catch {
    /* Signed out. */
  }
  const customerID = customer?.CustomerID;
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const saving = useRef(false);
  const [updating, setUpdating] = useState(false);
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

  async function cartAction(path, method, body, optimisticUpdate) {
    if (!cartId) {
      setError("Your cart is not ready. Please sign in or reload the page.");
      return;
    }
    if (saving.current) return;
    saving.current = true;
    setUpdating(true);
    const previousCart = cart;
    if (optimisticUpdate) setCart(optimisticUpdate(cart));
    setError("");
    try {
      const result = await api(`/api/cart/${cartId}${path}`, method, body);
      if (Array.isArray(result?.items)) {
        setCart(result);
      } else {
        await refreshCart();
      }
    } catch (err) {
      if (optimisticUpdate) setCart(previousCart);
      setError(err.message);
    } finally {
      saving.current = false;
      setUpdating(false);
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
        updating,
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
          cartAction(`/items/${id}`, "PUT", { quantity }, (current) => {
            const items = current.items
              .map((item) =>
                item.productId === id
                  ? {
                      ...item,
                      quantity,
                      lineTotal:
                        (Math.round(Number(item.price) * 100) * quantity) / 100,
                    }
                  : item,
              )
              .filter((item) => Number(item.quantity) > 0);
            return {
              items,
              subtotal:
                items.reduce(
                  (sum, item) =>
                    sum +
                    Math.round(Number(item.price) * 100) *
                      Number(item.quantity),
                  0,
                ) / 100,
            };
          }),
        removeItem: (id) => cartAction(`/items/${id}`, "DELETE"),
        clearCart: () => cartAction("", "DELETE"),
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
