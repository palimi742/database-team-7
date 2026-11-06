import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatPhone } from "../../api";
import { useShop } from "../../context/ShopContext.jsx";
import Navbar from "../../components/layout/Navbar";
import "../../css/customer/Checkout.css";
import StockAvailabilityDialog from "../../components/checkout/StockAvailabilityDialog.jsx";
import OrderSummary from "../../components/checkout/ordersummary.jsx";
import OrderPlacedModal from "../../components/orders/OrderPlacedModal.jsx";

export default function Checkout() {
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const { cartId, cart, setQuantity, updating, profile, checkoutInfo, setCheckoutInfo, refreshCart } =
    useShop();
  const navigate = useNavigate();

  const [type, setType] = useState(checkoutInfo?.type || "delivery");
  const [address, setAddress] = useState(
    checkoutInfo?.address ?? profile?.address ?? "",
  );
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [stockIssues, setStockIssues] = useState([]);
  const [stockNotice, setStockNotice] = useState("");
  const [contact, setContact] = useState(null);
  const [contactError, setContactError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(50);

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
  }, [cartId, type, cart]);

  const maximumPoints = summary?.rewards?.pointsUsed || 0;
  const selectedPoints = Number(pointsToRedeem);
  const validPoints = Number.isSafeInteger(selectedPoints) &&
    selectedPoints >= 50 && selectedPoints <= maximumPoints && selectedPoints % 50 === 0;
  const rewardDiscount = redeemPoints && validPoints ? selectedPoints / 50 : 0;
  const displayedSummary = summary ? {
    ...summary,
    loyaltyDiscount: rewardDiscount,
    total: Math.round((summary.total - rewardDiscount) * 100) / 100,
  } : null;

  async function adjustStock(item) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setStockNotice("");
    try {
      await api(`/api/cart/${cartId}/items/${item.productId}`,
        item.available > 0 ? "PUT" : "DELETE",
        item.available > 0 ? { quantity: item.available } : undefined);
      const data = await api(`/api/cart/${cartId}/summary?type=${type}`);
      setSummary(data);
      setStockIssues((issues) => issues.filter((issue) => issue.productId !== item.productId));
      setRedeemPoints(false);
      setStockNotice("Cart updated. Review your new total before placing your order.");
      await refreshCart();
    } catch (err) {
      setError(err.message);
      if (err.data?.code === "STOCK_UNAVAILABLE") {
        setStockIssues(err.data.stockIssues || []);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (submittingRef.current || updating || !cartId || !summary?.items.length) return;
    if (redeemPoints && !validPoints) {
      setError(`Enter points in multiples of 50, up to ${maximumPoints}.`);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    setStockNotice("");
    setStockIssues([]);
    setCheckoutInfo({ type, address: type === "delivery" ? address : "" });
    try {
      const { orderId } = await api(`/api/cart/${cartId}/checkout`, "POST", {
        fulfillmentType: type,
        deliveryAddress: type === "delivery" ? address : null,
        redeemPoints,
        pointsToRedeem: redeemPoints ? selectedPoints : 0,
      });
      setCheckoutInfo(null);
      setSummary(null);
      // The order is already saved; a refresh failure must not invite a second submission.
      await refreshCart().catch(console.error);
      setPlacedOrderId(orderId);
    } catch (err) {
      setError(err.message);
      if (err.data?.code === "STOCK_UNAVAILABLE") {
        setStockIssues(err.data.stockIssues || []);
      }
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

                {summary && !summary.rewards && (
                  <p className="note">Rewards information is temporarily unavailable. Please refresh checkout.</p>
                )}
                {summary?.rewards && !summary.rewards.isMember && (
                  <p className="note">Your account includes Freshmart Rewards. Your points balance is temporarily unavailable.</p>
                )}
                {summary?.rewards?.isMember && (
                  <div className="checkout-rewards">
                    <h3>Loyalty rewards</h3>
                    <p>You have {summary.rewards.currentPoints} points.</p>
                    {summary.rewards.pointsUsed > 0 ? (
                      <label className="checkout-rewards-choice">
                        <input
                          type="checkbox"
                          checked={redeemPoints}
                          onChange={(event) =>
                            setRedeemPoints(event.target.checked)
                          }
                        />
                        <span>
                          Redeem loyalty points
                        </span>
                      </label>
                    ) : (
                      <p>Redeem rewards in groups of 50 points for $1 off.</p>
                    )}
                    {redeemPoints && maximumPoints > 0 && (
                      <>
                        <label htmlFor="points-to-redeem">
                          Points to use
                          <input
                            id="points-to-redeem"
                            type="number"
                            min="50"
                            max={maximumPoints}
                            step="50"
                            required
                            value={pointsToRedeem}
                            aria-describedby="points-help"
                            aria-invalid={!validPoints}
                            onChange={(event) => setPointsToRedeem(event.target.value)}
                          />
                        </label>
                        <p id="points-help" className="checkout-rewards-help">
                          50 points = $1 off. You can use up to {maximumPoints.toLocaleString()} points
                          for ${(maximumPoints / 50).toFixed(2)} off this order.
                          Enter points in multiples of 50. Delivery fees are excluded.
                        </p>
                        {validPoints ? (
                          <p className="checkout-rewards-savings" aria-live="polite">
                            You’re using {selectedPoints.toLocaleString()} points to save ${rewardDiscount.toFixed(2)}.
                            You’ll keep {(summary.rewards.currentPoints - selectedPoints).toLocaleString()} existing points.
                          </p>
                        ) : (
                          <p className="error">Enter a multiple of 50 between 50 and {maximumPoints}.</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {error && <p className="error" role="alert">{error}</p>}
                {stockNotice && <p role="status">{stockNotice}</p>}
                <button
                  type="submit"
                  disabled={
                    submitting || updating ||
                    stockIssues.length > 0 ||
                    !cartId ||
                    !summary ||
                    summary.items.length === 0
                  }
                >
                  {submitting ? "Updating…" : "Place order"}
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

          <div className="checkout-summary-column">
            {stockIssues.length > 0 && (
              <StockAvailabilityDialog
                items={stockIssues}
                updating={submitting}
                onAdjust={adjustStock}
                onBack={() => navigate("/cart")}
              />
            )}
            <OrderSummary summary={displayedSummary} type={type} onQuantityChange={setQuantity} updating={updating || submitting} />
          </div>
        </div>
      </div>
    </div>
  );
}
