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
    return () => { loadVersion.current++; };
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
      const res = await managerFetch(`/api/returns/${returnRequestId}/${decision}`, {
        method: "PATCH",
        ...(decision === "approve" ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disposable }),
        } : {}),
      });
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

  return (
    <div>
      <ManagerSidebar />
      <dialog ref={approvalDialog} className="return-approval-modal"
        aria-labelledby="return-approval-title"
        onCancel={(event) => { if (saving) event.preventDefault(); }}>
        <h2 id="return-approval-title">Should this item be disposed of?</h2>
        <p><strong>{selectedRequest?.ProductName}</strong></p>
        <p>Return request #{selectedRequest?.ReturnRequestID} | Quantity: {selectedRequest?.Quantity}</p>
        <p>Yes approves the return without adding stock. No approves it and puts the quantity back on the shelf.</p>
        {error && <p className="return-approval-error" role="alert">{error}</p>}
        <div className="return-approval-actions">
          <button type="button" disabled={saving}
            onClick={() => reviewReturn(selectedRequest.ReturnRequestID, "approve", true)}>Yes — dispose</button>
          <button type="button" disabled={saving}
            onClick={() => reviewReturn(selectedRequest.ReturnRequestID, "approve", false)}>No — return to shelf</button>
          <button type="button" disabled={saving}
            onClick={() => approvalDialog.current.close()}>Cancel</button>
        </div>
      </dialog>

      <div className="manager-page">
        <h1>Return Requests</h1>
        <div className="return-view-buttons" aria-label="Return views">
          <button type="button" disabled={saving} aria-pressed={view === "Requested"}
            onClick={() => { setView("Requested"); setPage(1); }}>Pending</button>
          <button type="button" disabled={saving} aria-pressed={view === "Approved"}
            onClick={() => { setView("Approved"); setPage(1); }}>Approved returns</button>
          <button type="button" disabled={saving} aria-pressed={view === "Rejected"}
            onClick={() => { setView("Rejected"); setPage(1); }}>Rejected returns</button>
        </div>
        {loading && <p>Loading requests...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && (
          <>
          <div className="returns-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Status</th>
                {view === "Requested" ? <th>Actions</th> : view === "Approved" ? <>
                  <th>Approved date</th><th>Refund</th><th>Disposable</th>
                </> : <th>Rejected date</th>}
              </tr>
            </thead>

            <tbody>
              {visibleRequests.map((request) => (
                <tr key={request.ReturnRequestID}>
                  <td>{request.ReturnRequestID}</td>
                  <td>{request.ProductName}</td>
                  <td>{request.Quantity}</td>
                  <td>{request.Reason}</td>
                  <td>{request.Status}</td>
                  {view === "Requested" ? <td>
                    <button
                      disabled={saving}
                      onClick={() =>
                        openApproval(request)
                      }
                    >
                      Approve
                    </button>

                    <button
                      disabled={saving}
                      onClick={() =>
                        reviewReturn(request.ReturnRequestID, "decline")
                      }
                    >
                      Decline
                    </button>
                  </td> : view === "Approved" ? <>
                    <td>{fmtDate(request.ReturnDate)}</td>
                    <td>{request.RefundTotal == null ? "—" : money(request.RefundTotal)}</td>
                    <td>{request.Disposable == null ? "—" : Number(request.Disposable) === 1 ? "Yes" : "No"}</td>
                  </> : <td>{fmtDate(request.ReviewedDate)}</td>}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={view === "Requested" ? 6 : view === "Approved" ? 8 : 6}>No {view === "Requested" ? "pending return requests" : view === "Approved" ? "approved returns" : "rejected returns"}.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="returns-pagination">
            <label htmlFor="returns-page-size">Returns per page </label>
            <select id="returns-page-size" value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
            <span aria-live="polite">Showing {requests.length ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, requests.length)} of {requests.length} returns</span>
            <nav aria-label="Return pages">
              <button type="button" disabled={currentPage === 1 || saving} onClick={() => setPage(currentPage - 1)}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button type="button" disabled={currentPage === totalPages || saving} onClick={() => setPage(currentPage + 1)}>Next</button>
            </nav>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManagerReturns;
