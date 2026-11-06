import { money, fmtDate, formatPhone, returnStatus } from "../../api";
import { useNavigate } from "react-router-dom";
import "../../css/orders/Orders.css";

export default function ReceiptView({ order }) {
  const navigate = useNavigate();
  const isCompleted = order.status === "Completed";

  return (
    <>
      <div className="order-receipt-header">
        <div className="order-receipt-heading">
          <h3>Order #{order.id}</h3>
          <span className="order-receipt-status">{order.status}</span>
        </div>
        <div className="order-receipt-row">
          <span>{fmtDate(order.orderDate)}</span>
          <span>{order.fulfillmentType || "In-store"}</span>
        </div>
        <div className="order-receipt-row">
          <span>
            {order.firstName} {order.lastName}
          </span>
          {order.phone && <span>{formatPhone(order.phone)}</span>}
        </div>
        {order.fulfillmentType?.toLowerCase().includes("deliver") &&
          order.deliveryAddress && (
            <p className="order-receipt-address">{order.deliveryAddress}</p>
          )}
      </div>

      {order.items.map((orderItem) => (
        <div className="cart-row" key={orderItem.id}>
          <span>
            {orderItem.name} x {orderItem.quantity}
            <span className="item-return-statuses">
              {(order.returns || []).filter((request) => Number(request.itemId) === Number(orderItem.id)).map((request) => {
                const status = returnStatus(request.status);
                return (
                  <span className={`return-status return-status-${status.tone}`} key={request.id}>
                    Return {status.label.toLowerCase()} · {request.quantity} {Number(request.quantity) === 1 ? "item" : "items"}
                  </span>
                );
              })}
            </span>
          </span>
          <div className="order-item-actions">
            <span>{money(orderItem.unitPrice * orderItem.quantity)}</span>
            {isCompleted && orderItem.quantity > orderItem.returnedQty && (
              <button
                onClick={() =>
                  navigate(`/my-orders/${order.id}/return/${orderItem.id}`)
                }
              >
                Request return
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="cart-row">
        <span>Subtotal</span>
        <span>{money(order.subtotal)}</span>
      </div>
      <div className="cart-row">
        <span>Delivery fee</span>
        <span>{money(order.deliveryFee)}</span>
      </div>
      {Number(order.loyaltyDiscount) > 0 && (
        <div className="cart-row">
          <span>
            Loyalty points redeemed
            {Number(order.pointsRedeemed) > 0 && ` (${order.pointsRedeemed} points)`}
          </span>
          <span>−{money(order.loyaltyDiscount)}</span>
        </div>
      )}
      <div className="cart-row total">
        <span>Total</span>
        <span>{money(order.total)}</span>
      </div>
      {order.redemptionEstimated && Number(order.loyaltyDiscount) > 0 && (
        <p className="note">
          The exact number of points redeemed is unavailable for this older order.
        </p>
      )}
      <p>Payment: {order.paymentMethod}</p>
      {order.points > 0 && (
        <p className="note">Points earned: {order.points}</p>
      )}
    </>
  );
}
