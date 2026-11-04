import { money, fmtDate, formatPhone } from "../../api";
import { useNavigate } from "react-router-dom";

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
      <div className="cart-row total">
        <span>Total</span>
        <span>{money(order.total)}</span>
      </div>
      <p>Payment: {order.paymentMethod}</p>
      {order.points > 0 && (
        <p className="note">Points earned: {order.points}</p>
      )}
    </>
  );
}
