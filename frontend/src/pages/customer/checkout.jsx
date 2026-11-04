import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatPhone } from "../../api";
import { useShop } from "../../context/ShopContext.jsx";
import Navbar from "../../components/layout/Navbar";
import "../../css/customer/Checkout.css";
import OrderSummary from "../../components/checkout/ordersummary.jsx";
import OrderPlacedModal from "../../components/orders/OrderPlacedModal.jsx";

export default function Checkout() {
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const { cartId, profile, checkoutInfo, setCheckoutInfo, refreshCart } =
    useShop();
  const navigate = useNavigate();

  const [type, setType] = useState(checkoutInfo?.type || "delivery");
  const [address, setAddress] = useState(
    checkoutInfo?.address ?? profile?.address ?? "",
  );
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [contact, setContact] = useState(null);
  const [contactError, setContactError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    setContact(null);
    setContactError("");
    if (!cartId) return;
    let active = true;
    api(`/api/cart/${cartId}/contact`)
      .then((customer) => {
        if (active) setContact(customer);
      })
      .catch((err) => {
        if (active) setContactError(err.message);
      });
    return () => {
      active = false;
    };
  }, [cartId]);

  // The summary updates whenever delivery/curbside changes
  useEffect(() => {
    if (!cartId) return;
    let active = true;
    setSummary(null);
    setError("");
    api(`/api/cart/${cartId}/summary?type=${type}`)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [cartId, type]);

  async function submit(e) {
    e.preventDefault();
    if (submittingRef.current || !cartId || !summary?.items.length) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setCheckoutInfo({ type, address: type === "delivery" ? address : "" });
    try {
      const { orderId } = await api(`/api/cart/${cartId}/checkout`, "POST", {
        fulfillmentType: type,
        deliveryAddress: type === "delivery" ? address : null,
      });
      setCheckoutInfo(null);
      setSummary(null);
      // The order is already saved; a refresh failure must not invite a second submission.
      await refreshCart().catch(console.error);
      setPlacedOrderId(orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      {placedOrderId && (
        <OrderPlacedModal
          orderId={placedOrderId}
          onClose={() => setPlacedOrderId(null)}
        />
      )}
      <Navbar />
      <div className="checkout-container">
        <h1>Checkout</h1>
        <div id="view-checkout">
          <div className="panel checkout-form">
            <form onSubmit={submit}>
              <fieldset disabled={submitting}>
                <h3>Contact</h3>
                {contact ? (
                  <div className="checkout-contact">
                    <label htmlFor="checkout-name">
                      Name
                      <input
                        id="checkout-name"
                        type="text"
                        value={`${contact.firstName} ${contact.lastName}`}
                        readOnly
                      />
                    </label>
                    <label htmlFor="checkout-phone">
                      Phone number
                      <input
                        id="checkout-phone"
                        type="text"
                        value={formatPhone(contact.phone)}
                        placeholder="No phone number on file"
                        readOnly
                      />
                    </label>
                  </div>
                ) : (
                  <p className="note">
                    {contactError ||
                      (cartId
                        ? "Loading contact details…"
                        : "Please sign in to view your contact details.")}
                  </p>
                )}

                <h3>How would you like your order?</h3>
                <div className="radio-row">
                  <label>
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={type === "delivery"}
                      onChange={() => setType("delivery")}
                    />{" "}
                    Delivery
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={type === "curbside"}
                      onChange={() => setType("curbside")}
                    />{" "}
                    Curbside pickup
                  </label>
                </div>

                {type === "delivery" ? (
                  <label>
                    Delivery address
                    <input
                      type="text"
                      value={address}
                      required
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                ) : (
                  <p className="note">
                    Pick up your order at the store with curbside pickup.
                  </p>
                )}

                {error && <p className="error">{error}</p>}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !cartId ||
                    !summary ||
                    summary.items.length === 0
                  }
                >
                  {submitting ? "Submitting…" : "Checkout"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate("/cart")}
                >
                  Back to cart
                </button>
              </fieldset>
            </form>
          </div>

          <OrderSummary summary={summary} type={type} />
        </div>
      </div>
    </div>
  );
}
