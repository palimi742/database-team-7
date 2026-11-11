import { managerFetch, money, fmtDate } from "../../api.js";
import { useEffect, useState, useRef } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/ReturnApproval.css";

function ManagerReturns() {
  const approvalDialog = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const savingRef = useRef(false);
  const [view, setView] = useState("Requested");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const loadVersion = useRef(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadRequests() {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      const res = await managerFetch(`/api/returns?status=${view}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      if (version === loadVersion.current) setRequests(data);
    } catch (err) {
      if (version === loadVersion.current) setError(err.message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
    return () => {
      loadVersion.current++;
    };
  }, [view]);

  function openApproval(request) {
    setSelectedRequest(request);
    setError("");
    approvalDialog.current.showModal();
  }

  async function reviewReturn(returnRequestId, decision, disposable) {
    if (savingRef.current) return;
    savingRef.current = true;
    setError("");
    setSaving(true);
    try {
      const res = await managerFetch(
        `/api/returns/${returnRequestId}/${decision}`,
        {
          method: "PATCH",
          ...(decision === "approve"
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ disposable }),
              }
            : {}),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      approvalDialog.current.close();
      setSelectedRequest(null);
      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRequests = requests.slice(startIndex, startIndex + pageSize);

  function renderPagination(position) {
    return (
      <div className={`returns-pagination returns-pagination-${position}`}>
        <label htmlFor={`returns-page-size-${position}`}>
          Returns per page{" "}
        </label>
        <select
          id={`returns-page-size-${position}`}
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span aria-live="polite">
          Showing {requests.length ? startIndex + 1 : 0}–
          {Math.min(startIndex + pageSize, requests.length)} of{" "}
          {requests.length} returns
        </span>
        <nav aria-label={`Return pages (${position})`}>
          <button
            type="button"
            disabled={currentPage === 1 || saving}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages || saving}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div>
      <ManagerSidebar />
      <dialog
        ref={approvalDialog}
        className="return-approval-modal"
        aria-labelledby="return-approval-title"
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        <h2 id="return-approval-title">Should this item be disposed of?</h2>
        <p>
          <strong>{selectedRequest?.ProductName}</strong>
        </p>
        <p>
          Return request #{selectedRequest?.ReturnRequestID} | Quantity:{" "}
          {selectedRequest?.Quantity}
        </p>
        <p>
          Yes approves the return without adding stock. No approves it and puts
          the quantity back on the shelf.
        </p>
        {error && (
          <p className="return-approval-error" role="alert">
            {error}
          </p>
        )}
        <div className="return-approval-actions">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              reviewReturn(selectedRequest.ReturnRequestID, "approve", true)
            }
          >
            Yes — dispose
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              reviewReturn(selectedRequest.ReturnRequestID, "approve", false)
            }
          >
            No — return to shelf
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => approvalDialog.current.close()}
          >
            Cancel
          </button>
        </div>
      </dialog>

      <div className="manager-page">
        <h1 className="returns-heading">Return Requests</h1>
        <div
          className="return-view-buttons"
          role="group"
          aria-label="Return views"
        >
          <button
            type="button"
            disabled={saving}
            aria-pressed={view === "Requested"}
            onClick={() => {
              setView("Requested");
              setPage(1);
            }}
          >
            Pending
          </button>
          <button
            type="button"
            disabled={saving}
            aria-pressed={view === "Approved"}
            onClick={() => {
              setView("Approved");
              setPage(1);
            }}
          >
            Approved
          </button>
          <button
            type="button"
            disabled={saving}
            aria-pressed={view === "Rejected"}
            onClick={() => {
              setView("Rejected");
              setPage(1);
            }}
          >
            Rejected
          </button>
        </div>
        {loading && <p>Loading requests...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && (
          <>
            {visibleRequests.length > 0 && renderPagination("top")}
            {visibleRequests.length > 0 ? (
              <ul className="manager-return-list">
                {visibleRequests.map((request) => (
                  <li
                    className="manager-return-card"
                    key={request.ReturnRequestID}
                  >
                    <header>
                      <div>
                        <p className="return-reference">
                          Request #{request.ReturnRequestID}
                        </p>
                        <h2>{request.ProductName}</h2>
                      </div>
                      <span
                        className="return-status"
                        data-status={request.Status}
                      >
                        {request.Status === "Requested"
                          ? "Pending"
                          : request.Status}
                      </span>
                    </header>

                    <dl className="return-details">
                      <div>
                        <dt>Order ID</dt>
                        <dd>{request.TransactionID}</dd>
                      </div>
                      <div>
                        <dt>Customer</dt>
                        <dd>{request.CustomerName || "—"}</dd>
                      </div>
                      <div>
                        <dt>Reason</dt>
                        <dd>{request.Reason}</dd>
                      </div>
                      <div>
                        <dt>Quantity</dt>
                        <dd>{request.Quantity}</dd>
                      </div>
                      {view === "Approved" && (
                        <>
                          <div>
                            <dt>Refund</dt>
                            <dd>
                              {request.RefundTotal == null
                                ? "—"
                                : money(request.RefundTotal)}
                            </dd>
                          </div>
                          <div>
                            <dt>Approved on</dt>
                            <dd>{fmtDate(request.ReturnDate)}</dd>
                          </div>
                          <div>
                            <dt>Disposition</dt>
                            <dd>
                              {request.Disposable == null
                                ? "—"
                                : Number(request.Disposable) === 1
                                  ? "Dispose"
                                  : "Return to shelf"}
                            </dd>
                          </div>
                        </>
                      )}
                      {view === "Rejected" && (
                        <div>
                          <dt>Rejected on</dt>
                          <dd>{fmtDate(request.ReviewedDate)}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Customer ID</dt>
                        <dd>{request.CustomerID}</dd>
                      </div>
                      <div>
                        <dt>Customer cart ID</dt>
                        <dd>{request.CartID ?? "—"}</dd>
                      </div>
                    </dl>

                    {view === "Requested" && (
                      <div className="return-card-actions">
                        <button
                          type="button"
                          className="return-approve"
                          disabled={saving}
                          onClick={() => openApproval(request)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            reviewReturn(request.ReturnRequestID, "decline")
                          }
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="return-empty">
                No{" "}
                {view === "Requested"
                  ? "pending return requests"
                  : view === "Approved"
                    ? "approved returns"
                    : "rejected returns"}
                .
              </p>
            )}
            {renderPagination("bottom")}
          </>
        )}
      </div>
    </div>
  );
}

export default ManagerReturns;
