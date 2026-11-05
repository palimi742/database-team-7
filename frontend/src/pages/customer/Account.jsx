import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useShop } from "../../context/ShopContext";
import Navbar from "../../components/layout/Navbar";
import "../../css/customer/Account.css";

export default function Account() {
  const [customer, setCustomer] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivationError, setDeactivationError] = useState("");
  const deactivateDialog = useRef(null);
  const { loadProfile, setCheckoutInfo } = useShop();

  useEffect(() => {
    let active = true;
    api("/api/customers/profile")
      .then(data => { if (active) setCustomer(data); })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  function change(event) {
    setCustomer({ ...customer, [event.target.name]: event.target.value });
  }

  async function deactivate() {
    setDeactivating(true);
    setDeactivationError("");
    try {
      await api("/api/customers/profile/deactivate", "POST");
      sessionStorage.removeItem("customer");
      // Reload to clear customer profile and cart data held in React memory.
      window.location.replace("/customer-login?notice=account-inactive");
    } catch (error) {
      setDeactivationError(error.message);
      setDeactivating(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSaved(false);
    try {
      await api("/api/customers/profile", "PUT", customer);
      setCheckoutInfo(null);
      // Refresh the default contact information used by future checkouts.
      await loadProfile().catch(() => {});
      setSaved(true);
      setMessage("Account updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="account-page">
        <h1>My Account</h1>
        <p>Update your contact details for future orders. Existing order delivery addresses stay unchanged.</p>
        {message && (
          <div className={saved ? "account-message account-success" : "account-message account-error"} role="status" aria-live="polite">
            {message}
          </div>
        )}
        {!customer ? (
          <div><Link to="/customer-login">Sign in</Link> to manage your account.</div>
        ) : (
          <form onSubmit={save}>
            <div className="account-field">
              <label htmlFor="first-name">First name</label>
              <input id="first-name" name="FirstName" value={customer.FirstName} onChange={change} maxLength={100} autoComplete="given-name" required />
            </div>
            <div className="account-field">
              <label htmlFor="last-name">Last name</label>
              <input id="last-name" name="LastName" value={customer.LastName} onChange={change} maxLength={100} autoComplete="family-name" required />
            </div>
            <div className="account-field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="PhoneNumber" type="tel" value={customer.PhoneNumber} onChange={change} maxLength={50} autoComplete="tel" required />
            </div>
            <div className="account-field">
              <label htmlFor="address">Default delivery address</label>
              <input id="address" name="CustomerAddress" value={customer.CustomerAddress} onChange={change} maxLength={150} autoComplete="street-address" required />
            </div>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            <section className="account-deactivate-section">
              <h2>Deactivate account</h2>
              <p>Deactivating your account signs you out and prevents future sign-ins. Contact FreshMart if you need it reactivated.</p>
              <button type="button" className="account-deactivate-button" disabled={saving || deactivating}
                onClick={() => { setDeactivationError(""); deactivateDialog.current.showModal(); }}>
                Deactivate account
              </button>
            </section>
          </form>
        )}
        <dialog ref={deactivateDialog} className="account-deactivate-dialog"
          aria-labelledby="deactivate-title" aria-describedby="deactivate-description"
          onCancel={event => { if (deactivating) event.preventDefault(); }}>
          <h2 id="deactivate-title">Deactivate your account?</h2>
          <p id="deactivate-description">You’ll be signed out and won’t be able to sign in again unless FreshMart reactivates your account. Your past orders will be kept.</p>
          {deactivationError && <p role="alert" className="account-error">{deactivationError}</p>}
          <div className="account-deactivate-actions">
            <button type="button" autoFocus disabled={deactivating} onClick={() => deactivateDialog.current.close()}>Cancel</button>
            <button type="button" className="account-deactivate-button" disabled={deactivating} onClick={deactivate}>
              {deactivating ? "Deactivating…" : "Deactivate account"}
            </button>
          </div>
        </dialog>
      </div>
    </div>
  );
}
