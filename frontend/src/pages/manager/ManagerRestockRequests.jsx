import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/employee/EmployeeFulfillment.css";

const API = "/api/manager/restock-requests";

export default function ManagerRestockRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyRequest, setBusyRequest] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const parameters = new URLSearchParams({ status });

        const response = await fetch(`${API}?${parameters}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });

        if (response.status === 401) {
          setRequests([]);
          localStorage.removeItem("employee");
          navigate("/login", { replace: true });
          return;
        }

        if (response.status === 403) {
          setRequests([]);
          navigate("/employee", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load restock requests.",
          );
        }

        setRequests(data.requests);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setRequests([]);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [status, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadRequests(controller.signal);

    return () => controller.abort();
  }, [loadRequests]);

  async function reviewRequest(requestId, decision) {
    setBusyRequest(requestId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/${requestId}/review`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            note: notes[requestId] || "",
          }),
        },
      );

      if (response.status === 401) {
        setRequests([]);
        localStorage.removeItem("employee");
        navigate("/login", { replace: true });
        return;
      }

      if (response.status === 403) {
        setRequests([]);
        navigate("/employee", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to review this request.",
        );
      }

      setNotes((previous) => {
        const updated = { ...previous };
        delete updated[requestId];
        return updated;
      });

      await loadRequests();
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyRequest(null);
    }
  }

async function receiveStock(request) {
  const confirmed = window.confirm(
    `Confirm that all ${request.RequestedQuantity} units of ` +
    `${request.InventoryName} have arrived? ` +
    "This will increase inventory.",
  );

  if (!confirmed) return;

  setBusyRequest(request.RequestID);
  setError("");
  setMessage("");

  try {
    const response = await fetch(
      `${API}/${request.RequestID}/receive`,
      {
        method: "PATCH",
        credentials: "same-origin",
      },
    );

    if (response.status === 401) {
      setRequests([]);
      localStorage.removeItem("employee");
      navigate("/login", { replace: true });
      return;
    }

    if (response.status === 403) {
      setRequests([]);
      navigate("/employee", { replace: true });
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to record received stock.",
      );
    }

    await loadRequests();
    setMessage(data.message);
  } catch (err) {
    setError(err.message);
  } finally {
    setBusyRequest(null);
  }
}

  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "—";
  }

  return (
    <div className="employee-page">
      <header className="employee-header">
        <h1>Manage Restock Requests</h1>
        <p>Review inventory requests submitted by employees.</p>
        <Link to="/manager">Back to Manager Dashboard</Link>
      </header>

      <section className="employee-panel">
        <div className="employee-toolbar">
          <h2>Restock Requests</h2>

          <div>
            <label htmlFor="request-status">Status: </label>
            <select
              id="request-status"
              value={status}
              disabled={loading || busyRequest !== null}
              onChange={(event) => {
                setStatus(event.target.value);
                setMessage("");
              }}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="All">All</option>
            </select>

            <button
              onClick={() => loadRequests()}
              disabled={loading || busyRequest !== null}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <p role="status">Loading requests...</p>
        )}

        {error && (
          <p className="employee-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="employee-success" role="status">
            {message}
          </p>
        )}

        {!loading && !error && requests.length === 0 && (
          <p>No requests found for this status.</p>
        )}

        <div className="employee-order-grid">
          {requests.map((request) => (
            <article
              className="employee-order"
              key={request.RequestID}
            >
              <div className="employee-order-top">
                <div>
                  <h3>{request.InventoryName}</h3>
                  <p>Request #{request.RequestID}</p>
                  <p>SKU: {request.SKU}</p>
                </div>

                <span className="employee-status">
                  {request.Status}
                </span>
              </div>

              <p>
                <strong>Requested by:</strong>{" "}
                {request.EmployeeFirstName}{" "}
                {request.EmployeeLastName}
              </p>

              <p>
                <strong>Requested quantity:</strong>{" "}
                {request.RequestedQuantity}
              </p>

              <p>
                <strong>Stock when requested:</strong>{" "}
                {request.StockAtRequest}
              </p>

              <p>
                <strong>Current stock:</strong>{" "}
                {request.CurrentStock}
              </p>

              <p>
                <strong>Employee note:</strong>{" "}
                {request.EmployeeNote || "—"}
              </p>

              <p>
                <strong>Submitted:</strong>{" "}
                {formatDate(request.CreatedAt)}
              </p>

              {request.Status === "Pending" ? (
                <>
                  <label htmlFor={`note-${request.RequestID}`}>
                    Manager note (optional)
                  </label>

                  <textarea
                    id={`note-${request.RequestID}`}
                    rows={3}
                    maxLength={500}
                    value={notes[request.RequestID] || ""}
                    disabled={loading || busyRequest !== null}
                    onChange={(event) =>
                      setNotes((previous) => ({
                        ...previous,
                        [request.RequestID]: event.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: "8px",
                      marginBottom: "12px",
                      padding: "10px",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      disabled={loading || busyRequest !== null}
                      onClick={() =>
                        reviewRequest(request.RequestID, "Approved")
                      }
                    >
                      {busyRequest === request.RequestID
                        ? "Saving..."
                        : "Approve"}
                    </button>

                    <button
                      disabled={loading || busyRequest !== null}
                      onClick={() =>
                        reviewRequest(request.RequestID, "Rejected")
                      }
                      style={{ backgroundColor: "#b91c1c" }}
                    >
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>Manager note:</strong>{" "}
                    {request.ManagerNote || "—"}
                  </p>

                  {request.ManagerFirstName && (
                    <p>
                      <strong>Reviewed by:</strong>{" "}
                      {request.ManagerFirstName}{" "}
                      {request.ManagerLastName}
                    </p>
                  )}

                  <p>
                    <strong>Reviewed:</strong>{" "}
                    {formatDate(request.ReviewedAt)}
                  </p>
                  
                  {request.Status === "Approved" && (
  <button
    disabled={loading || busyRequest !== null}
    onClick={() => receiveStock(request)}
  >
    {busyRequest === request.RequestID
      ? "Saving..."
      : "Confirm Stock Received"}
  </button>
)}
                  {request.FulfilledAt && (
                    <p>
                      <strong>Received:</strong>{" "}
                      {formatDate(request.FulfilledAt)}
                    </p>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}