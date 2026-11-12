import { useEffect, useRef, useState } from "react";
import { managerFetch } from "../../api.js";
import ReceiptView from "./receiptview.jsx";
import "../../css/orders/OrderDetails.css";
import "../../css/manager/CustomerLoyaltyReport.css";

export default function OrderReceipt({ orderId, onClose }) {
  const dialog = useRef(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    if (!dialog.current.open) dialog.current.showModal();

    async function loadReceipt() {
      try {
        const response = await managerFetch(
          `/api/reports/loyalty/orders/${orderId}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load the receipt.");
        if (!controller.signal.aborted) setOrder(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }

    void loadReceipt();
    return () => controller.abort();
  }, [orderId]);

  return (
    <dialog
      ref={dialog}
      className="loyalty-receipt"
      aria-labelledby="loyalty-receipt-title"
      onClose={onClose}
    >
      <div className="loyalty-receipt-heading">
        <h2 id="loyalty-receipt-title">Order receipt</h2>
        <form method="dialog">
          <button type="submit">Close</button>
        </form>
      </div>
      {error && <p role="alert">{error}</p>}
      {!order && !error && <p role="status">Loading receipt…</p>}
      {order && (
        <div className="order-details-card receipt">
          <ReceiptView order={order} readOnly />
        </div>
      )}
    </dialog>
  );
}
