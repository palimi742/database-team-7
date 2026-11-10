import { useState } from "react";

const issueTypes = ["Missing item", "Damaged product", "Pickup no-show", "Delivery problem", "Other"];

export default function OrderIssueForm({ order, disabled, onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [details, setDetails] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (await onSubmit({ issueType, details })) {
      setIssueType("");
      setDetails("");
      setIsOpen(false);
    }
  }

  return (
    <section className="fm-issue-area" aria-label={`Issues for order ${order.TransactionID}`}>
      {order.issues.length > 0 && (
        <>
          <h4>Reported issues</h4>
          <ul className="fm-issue-list">
            {order.issues.map((issue) => (
              <li key={issue.IssueID}>
                <strong>{issue.IssueType}</strong>
                <p>{issue.Details}</p>
                {issue.ManagerResponse
                  ? <p className="fm-reply"><strong>Manager reply</strong><br />{issue.ManagerResponse}</p>
                  : <p className="fm-subtle">Waiting for a manager reply</p>}
              </li>
            ))}
          </ul>
        </>
      )}
      {order.status !== "Completed" && (
        <>
          <button type="button" className="fm-secondary" aria-expanded={isOpen}
            aria-controls={`issue-form-${order.FulfillmentID}`} disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Close issue form" : "Report an issue"}
          </button>
          <form id={`issue-form-${order.FulfillmentID}`} className="fm-form" hidden={!isOpen} onSubmit={submit}>
            <label>
              Issue type
              <select required value={issueType} disabled={disabled} onChange={(event) => setIssueType(event.target.value)}>
                <option value="">Choose an issue type</option>
                {issueTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              What happened?
              <textarea required rows={3} maxLength={500} value={details} disabled={disabled}
                onChange={(event) => setDetails(event.target.value)} />
            </label>
            <button disabled={disabled || !issueType || !details.trim()}>Send to manager</button>
          </form>
        </>
      )}
    </section>
  );
}