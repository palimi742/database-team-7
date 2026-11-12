import "./DismissButton.css";

export default function DismissButton({ onClick }) {
  return (
    <button
      type="button"
      className="fm-dismiss-button"
      aria-label="Dismiss message"
      onClick={onClick}
    >
      X
    </button>
  );
}
