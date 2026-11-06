import { managerFetch } from "../../api.js";
import { useEffect, useState, useRef } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/ReturnApproval.css";

function ManagerReturns() {
  const approvalDialog = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const savingRef = useRef(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await managerFetch("/api/returns");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

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
  return (
    <div>
      <ManagerSidebar />
      <dialog ref={approvalDialog} className="return-approval-modal"
        aria-labelledby="return-approval-title"
        onCancel={(event) => { if (saving) event.preventDefault(); }}>
        <h2 id="return-approval-title">Should this item be disposed of?</h2>
        <p><strong>{selectedRequest?.ProductName}</strong></p>
        <p>Return request #{selectedRequest?.ReturnRequestID} · Quantity: {selectedRequest?.Quantity}</p>
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

      <div className="manager-main-dashboard">
        <h1>Return Requests</h1>
        {loading && <p>Loading requests...</p>}
        {error && <p>{error}</p>}
        {!loading && (
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.ReturnRequestID}>
                  <td>{request.ReturnRequestID}</td>
                  <td>{request.ProductName}</td>
                  <td>{request.Quantity}</td>
                  <td>{request.Reason}</td>
                  <td>{request.Status}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6}>No pending return requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ManagerReturns;
