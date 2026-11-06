import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import Navbar from "../../components/layout/Navbar";
import "../../css/orders/OrderDetails.css";
import "../../css/orders/ReturnRequest.css";

const REASONS = [
  "Spoiled or expired",
  "Damaged",
  "Wrong item received",
  "Not as described",
  "Changed my mind",
  "Other",
];

export default function ReturnRequest() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(itemId || "");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api(`/api/my-orders/${orderId}`)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [orderId]);

  const returnableItems = order
    ? order.items.filter(
        (orderItem) => orderItem.quantity > orderItem.returnedQty,
      )
    : [];
  const selectedItem = returnableItems.find(
    (orderItem) => String(orderItem.id) === selectedItemId,
  );
  async function submit(event) {
    event.preventDefault();
    if (submitting || !selectedItem || order.status !== "Completed") return;
    setError("");
    setSubmitting(true);
    try {
      await api(`/api/my-orders/${orderId}/returns`, "POST", {
        transactionItemId: Number(selectedItemId),
        quantity: Number(quantity),
        reason,
        details,
      });
      navigate(`/my-orders/${orderId}`, {
        state: {
          message: "Return request submitted. It is pending store review.",
        },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="order-details-page">
      <Navbar />
      <div className="order-details-container">
        <h1>Request return</h1>
        {error && <p className="order-details-error">{error}</p>}
        {!order && !error && <p>Loading order...</p>}
        {order && (
          <div className="order-details-card return-form">
            <h3>Order #{order.id}</h3>
            {order.status !== "Completed" ? (
              <p>Returns are available after your order is completed.</p>
            ) : returnableItems.length === 0 ? (
              <p>No items are available to return.</p>
            ) : (
              <form onSubmit={submit}>
                <p>
                  Returns can be requested within {order.returnWindowDays} days
                  of your order.
                </p>
                <label>
                  Item to return
                  <select
                    value={selectedItemId}
                    required
                    disabled={submitting}
                    onChange={(event) => {
                      setSelectedItemId(event.target.value);
                      setQuantity("1");
                    }}
                  >
                    <option value="">Choose an item</option>
                    {returnableItems.map((orderItem) => (
                      <option key={orderItem.id} value={orderItem.id}>
                        {orderItem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    required
                    disabled={submitting || !selectedItem}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                  />
                </label>
                <label>
                  Reason
                  <select
                    value={reason}
                    disabled={submitting}
                    onChange={(event) => setReason(event.target.value)}
                  >
                    {REASONS.map((returnReason) => (
                      <option key={returnReason}>{returnReason}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Details (optional)
                  <textarea
                    rows="3"
                    value={details}
                    disabled={submitting}
                    onChange={(event) => setDetails(event.target.value)}
                  />
                </label>
                <button type="submit" disabled={submitting || !selectedItem}>
                  {submitting ? "Submitting…" : "Submit return request"}
                </button>
              </form>
            )}
          </div>
        )}
        <button
          className="secondary"
          onClick={() => navigate(`/my-orders/${orderId}`)}
        >
          Back to order
        </button>
      </div>
    </div>
  );
}
