import { useState } from "react";
import "../css/PasswordInput.css";

function PasswordInput({ autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls="password"
        onClick={() => setVisible((current) => !current)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}

export default PasswordInput;
