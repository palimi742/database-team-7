import { useEffect, useState } from "react";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";

function ManagerReturns() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/returns");
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

  async function reviewReturn(returnRequestId, decision) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/returns/${returnRequestId}/${decision}`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      await loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <ManagerSidebar />

      <div className="manager-main-dashboard">
        <h1>Return Requests</h1>
        {loading && <p>Loading requests...</p>}
        {error && <p>{error}</p>}
        {!loading && (
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Transaction Item</th>
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
                  <td>{request.TransactionItemID}</td>
                  <td>{request.Quantity}</td>
                  <td>{request.Reason}</td>
                  <td>{request.Status}</td>
                  <td>
                    <button
                      disabled={saving}
                      onClick={() =>
                        reviewReturn(request.ReturnRequestID, "approve")
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
