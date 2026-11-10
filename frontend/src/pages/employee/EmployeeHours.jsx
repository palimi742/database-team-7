import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/employee/EmployeeFulfillment.css";
import "../../css/employee/EmployeeWorkspace.css";

const API = "/api/employee/time";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago",
});

export default function EmployeeHours() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = useCallback(async (path, options) => {
    const response = await fetch(API + path, { cache: "no-store", ...options });
    if (response.status === 401) {
      localStorage.removeItem("employee");
      navigate("/employee/login", { replace: true });
      return null;
    }
    const body = await response.json();
    if (!response.ok) throw new Error(body.message);
    return body;
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    request("", { signal: controller.signal }).then(setData).catch((err) => {
      if (err.name !== "AbortError") setError(err.message);
    });
    return () => controller.abort();
  }, [request]);

  const openShift = data?.shifts.find((shift) => !shift.ClockOut);

  async function punch() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await request(openShift ? "/clock-out" : "/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeEntryId: openShift?.TimeEntryID }),
      });
      if (result) setMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      try {
        setData(await request(""));
      } catch (err) {
        setError(err.message);
        setData(null);
      }
      setBusy(false);
    }
  }

  return (
    <main className="employee-page fm-workspace">
      <header className="fm-hero">
        <Link className="fm-back" to="/employee">← Employee dashboard</Link>
        <p className="fm-eyebrow">Time and attendance</p>
        <h1>My Hours &amp; Pay</h1>
        <p>Clock in and out, check your hours, and review your shift history.</p>
      </header>

      {error && <p className="employee-error fm-feedback" role="alert">{error}</p>}
      {message && <p className="employee-success fm-feedback" role="status">{message}</p>}
      {!data && !error && <p role="status">Loading your shifts…</p>}
      {!data && error && <button type="button" onClick={() => window.location.reload()}>Try again</button>}
      {data && (
        <>
          <section className="employee-panel fm-shift">
            <div>
              <span className="employee-status">{openShift ? "On shift" : "Off shift"}</span>
              <h2>{openShift ? "Your shift is in progress" : "Ready to start your shift?"}</h2>
              {openShift && <p>Clocked in {dateTime.format(new Date(openShift.ClockIn))} CT</p>}
            </div>
            <button type="button" onClick={punch} disabled={busy}>
              {busy ? "Saving…" : openShift ? "Clock Out" : "Clock In"}
            </button>
          </section>

          <dl className="fm-metrics">
            <div><dt>Hours in the past 7 days</dt><dd>{(data.summary.secondsWorked / 3600).toFixed(2)}</dd></div>
            <div><dt>Current hourly rate</dt><dd>{money.format(data.hourlyRate)}</dd></div>
            <div><dt>Estimated base earnings · 7 days</dt><dd>{money.format(data.summary.estimatedPay)}</dd></div>
          </dl>

          <section className="employee-panel">
            <h2>Shift history</h2>
            <p className="fm-subtle">Latest 30 shifts · Central time · Estimates use completed shifts at their recorded base rates.</p>
            {data.shifts.length === 0 ? <p>No shifts recorded yet.</p> : (
              <div className="fm-table-wrap">
                <table className="fm-table">
                  <thead><tr><th scope="col">Clock in</th><th scope="col">Clock out</th><th scope="col">Hours</th><th scope="col">Base estimate</th></tr></thead>
                  <tbody>
                    {data.shifts.map((shift) => (
                      <tr key={shift.TimeEntryID}>
                        <td>{dateTime.format(new Date(shift.ClockIn))}</td>
                        <td>{shift.ClockOut ? dateTime.format(new Date(shift.ClockOut)) : "In progress"}</td>
                        <td>{shift.ClockOut ? (shift.SecondsWorked / 3600).toFixed(2) : "—"}</td>
                        <td>{shift.ClockOut ? money.format(shift.SecondsWorked / 3600 * shift.HourlyRate) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}