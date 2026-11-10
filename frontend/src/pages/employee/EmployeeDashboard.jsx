import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { employeeApi, money } from "./employeeApi";
import "../../css/employee/EmployeeShiftHub.css";

function Icon({ name }) {
  const shapes = {
    leaf: <><path d="M12 22v-8"/><path d="M12 16C5 16 3 12 3 7c6 0 9 3 9 7m0 0c0-5 3-8 9-8 0 5-3 8-9 8"/></>,
    cart: <><path d="M3 10h18l-2 10H5zM8 10l4-6 4 6"/><path d="M9 14v3m6-3v3"/></>,
    box: <><path d="M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4m-8 4v10"/></>,
    history: <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>,
    inventory: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16m-8 0v10"/></>,
    restock: <><path d="M4 11a8 8 0 1 1 2 7M4 5v6h6m2-3v8m-4-4h8"/></>,
  };
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [orders, setOrders] = useState(null);
  const [time, setTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/employees/session", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) {
          localStorage.removeItem("employee");
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error("Unable to verify your login.");
        const { employee: account } = await response.json();
        if (String(account.EmployeeRole).toLowerCase() === "manager") {
          navigate("/manager", { replace: true });
          return;
        }
        setEmployee(account);
        const [orderResult, timeResult] = await Promise.allSettled([
          employeeApi("orders", { signal: controller.signal }),
          employeeApi("time", { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        if (orderResult.status === "fulfilled") setOrders(orderResult.value);
        if (timeResult.status === "fulfilled") setTime(timeResult.value);
        if (orderResult.status === "rejected" || timeResult.status === "rejected") {
          setError("Some dashboard details could not load. Refresh to try again.");
        }
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [navigate]);

  const activeShift = time?.shifts.find((shift) => !shift.ClockOut);
  const activeOrders = orders?.assigned.length;
  const ready = orders?.assigned.find((order) => Number(order.ready) === 1);
  const seconds = Number(time?.summary.secondsWorked ?? 0);
  const duration = `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m`;
  const shortcuts = [
    ["box", "blue", "My Orders", activeOrders == null ? "Assigned fulfillment" : `${activeOrders} active`, "/employee/fulfillment"],
    ["history", "green", "Recent Orders", "Orders you placed", "#recent-orders"],
    ["inventory", "lemon", "Inventory", "Check stock levels", "/employee/inventory"],
    ["restock", "lilac", "Restock Requests", orders?.restockUpdate ? "Latest decision available" : "View requests", "/employee/restock-requests"],
  ];

  async function punch() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await employeeApi(activeShift ? "time/clock-out" : "time/clock-in", {
        method: "POST",
        body: JSON.stringify(activeShift ? { timeEntryId: activeShift.TimeEntryID } : {}),
      });
      setNotice(result.message);
    } catch (err) { setError(err.message); }
    try { setTime(await employeeApi("time")); }
    catch (err) { setTime(null); setError(err.message); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/employees/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Try again.");
      localStorage.removeItem("employee");
      setEmployee(null);
navigate("/login", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <main className="shift-hub">
      <header className="hub-header">
        <Link to="/" className="hub-brand"><span className="hub-icon"><Icon name="leaf" /></span>
          <span>FreshMart<small>Employee workspace</small></span>
        </Link>
        {employee && <button className="hub-button hub-secondary" disabled={busy} onClick={signOut}>Sign out</button>}
      </header>
      <div className="hub-shell">
        {error && <p className="hub-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {loading && <p role="status">Loading your workspace…</p>}
        {employee && (
          <>
            <div className="hub-hero-grid">
              <section className="hub-welcome">
                <span className="hub-eyebrow">Shift overview</span>
                <h1>Hey, {employee.FirstName}!</h1>
                <p>{activeOrders == null ? "Your FreshMart workspace." : activeOrders === 0
                  ? "You’re caught up on assigned orders." : `${activeOrders} active assigned order${activeOrders === 1 ? "" : "s"}.`}</p>
                <Link className="hub-button" to="/employee/place-order"><Icon name="cart" /> Place Customer Order →</Link>
              </section>
              <section className="hub-clock">
                <span className="hub-eyebrow">Time clock</span>
                <h2>{time ? activeShift ? "On shift" : "Off shift" : "Shift status unavailable"}</h2>
                <p>{activeShift ? `Clocked in at ${new Date(activeShift.ClockIn).toLocaleTimeString("en-US",
                  { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })} CT` : "Track your shift from here."}</p>
                <button className="hub-button" disabled={!time || busy} onClick={punch}>
                  {activeShift ? "Clock Out" : "Clock In"}
                </button>
              </section>
            </div>
            <h2>Quick actions</h2>
            <div className="hub-shortcuts">
              {shortcuts.map(([icon, color, label, detail, to]) => {
                const content = <><span className={`hub-icon hub-${color}`}><Icon name={icon} /></span>
                  <strong>{label} <span aria-hidden="true">→</span></strong><small>{detail}</small></>;
                return to.startsWith("#") ? <a className="hub-card" key={to} href={to}>{content}</a>
                  : <Link className="hub-card" key={to} to={to}>{content}</Link>;
              })}
            </div>
            <div className="hub-bottom">
              <section className="hub-panel">
                <h2><Link to="/employee/hours">My Hours &amp; Pay →</Link></h2>
                <dl className="hub-stats">
                  <div><dt>Hours · last 7 days</dt><dd>{time ? duration : "—"}</dd></div>
                  <div><dt>Base pay estimate · 7 days</dt><dd>{time ? money.format(time.summary.estimatedPay) : "—"}</dd></div>
                  <div><dt>Orders placed today</dt><dd>{orders?.ordersToday ?? "—"}</dd></div>
                </dl>
              </section>
              <section className="hub-panel hub-attention">
                <h2>Needs attention</h2>
                {ready && <p><Link to="/employee/fulfillment">Order #{ready.orderId} · {ready.method} ready →</Link></p>}
                {orders?.restockUpdate && <p><Link to="/employee/restock-requests">
                  {orders.restockUpdate.name} · {orders.restockUpdate.status} →
                </Link></p>}
                {!ready && !orders?.restockUpdate && <p>{orders ? "No ready orders or restock decisions." : "Updates unavailable."}</p>}
              </section>
            </div>
            <section className="hub-panel hub-recent" id="recent-orders">
              <h2>Recent customer orders</h2>
              {orders?.recent.length ? (
                <ul className="hub-list">{orders.recent.map((order) => (
                  <li key={order.orderId}><div><strong>Order #{order.orderId}</strong> · {order.method}</div>
                    <span className="hub-badge">{order.status}</span><strong>{money.format(order.total)}</strong></li>
                ))}</ul>
              ) : <p>{orders ? "Orders you place for customers will appear here." : "Order history unavailable."}</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}