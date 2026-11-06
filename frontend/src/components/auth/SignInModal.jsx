import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/auth/SignInModal.css";

export default function SignInModal({ onClose }) {
  const dialogRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="sign-in-modal" aria-labelledby="sign-in-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <h2 id="sign-in-title">Sign in to add items</h2>
      <p>Please sign in to your account to add items to your cart.</p>
      <button type="button" onClick={() => navigate("/customer-login")}>Sign in</button>
      <button type="button" className="secondary" onClick={onClose}>Keep browsing</button>
    </dialog>
  );
}
