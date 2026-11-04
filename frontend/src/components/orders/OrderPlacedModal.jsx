import { useNavigate } from "react-router-dom";
import "../../css/orders/OrderPlacedModal.css";

function OrderPlacedModal({ orderId, onClose }) {
  const navigate = useNavigate();

  function goTo(path) {
    onClose();
    navigate(path);
  }

  return (
    <div className="order-modal-bg">
      <div className="order-modal">
        <h2>Order #{orderId} has been placed.</h2>
        <p>Thank you for shopping with FreshMart!</p>
        <div className="order-modal-btns">
          <button onClick={() => goTo("/my-orders")}>View past orders</button>
          <button
            className="order-modal-secondary"
            onClick={() => goTo("/browse")}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderPlacedModal;
