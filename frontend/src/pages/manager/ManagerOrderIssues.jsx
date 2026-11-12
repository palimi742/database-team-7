import DismissButton from "../../components/layout/DismissButton.jsx";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerFetch } from "../../api.js";
import "../../css/employee/EmployeeFulfillment.css";
import "../../css/employee/EmployeeWorkspace.css";

const API = "/api/manager/order-issues";

export default function ManagerOrderIssues() {
  const [issues, setIssues] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadIssues = useCallback(async (signal) => {
    if (!signal) setLoading(true);
    try {
      const response = await managerFetch(API, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setIssues(data.issues);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadIssues(controller.signal);
    return () => controller.abort();
  }, [loadIssues]);

  async function reply(event, id) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await managerFetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: drafts[id]?.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      await loadIssues();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="employee-page fm-workspace">
      <header className="fm-hero">
        <Link className="fm-back" to="/manager">
          ← Manager dashboard
        </Link>
        <p className="fm-eyebrow">Order support</p>
        <h1>Reported Order Issues</h1>
        <p>Review employee reports and send a response.</p>
      </header>
      <div className="fm-feedback">
        <button
          type="button"
          disabled={loading || saving}
          onClick={() => {
            setError("");
            loadIssues();
          }}
        >
          Refresh issues
        </button>
        {loading && <p role="status">Loading issues…</p>}
        {error && (
          <p role="alert" className="employee-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="employee-success">
            {message} <DismissButton onClick={() => setMessage("")} />
          </p>
        )}
      </div>
      {!loading && !error && !issues.length && (
        <p className="employee-panel">No order issues have been reported.</p>
      )}
      <div className="employee-order-grid">
        {issues.map((issue) => (
          <article className="employee-order fm-issue" key={issue.IssueID}>
            <div className="employee-order-top">
              <h3>Order #{issue.TransactionID}</h3>
              <span className="employee-status">
                {issue.ManagerResponse ? "Responded" : "Needs reply"}
              </span>
            </div>
            <p className="fm-subtle">
              {issue.FirstName} {issue.LastName} ·{" "}
              {new Date(issue.ReportedAt).toLocaleString()}
            </p>
            <p>
              <strong>{issue.IssueType}</strong>
            </p>
            <p>{issue.Details}</p>
            {issue.ManagerResponse ? (
              <p className="fm-reply">
                <strong>Response</strong>
                <br />
                {issue.ManagerResponse}
              </p>
            ) : (
              <form
                className="fm-form"
                onSubmit={(event) => reply(event, issue.IssueID)}
              >
                <label htmlFor={`reply-${issue.IssueID}`}>
                  Response to employee
                </label>
                <textarea
                  id={`reply-${issue.IssueID}`}
                  rows={3}
                  required
                  maxLength={500}
                  value={drafts[issue.IssueID] || ""}
                  onChange={(event) =>
                    setDrafts({
                      ...drafts,
                      [issue.IssueID]: event.target.value,
                    })
                  }
                />
                <button disabled={saving || !drafts[issue.IssueID]?.trim()}>
                  Send response
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
