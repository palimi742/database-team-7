import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../css/customer/Home.css";

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/employees/session", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          localStorage.removeItem("employee");
          navigate("/employee/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to verify your login.",
          );
        }

        if (
          String(data.employee.EmployeeRole).toLowerCase() === "manager"
        ) {
          navigate("/manager", { replace: true });
          return;
        }

        setEmployee(data.employee);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => controller.abort();
  }, [navigate]);

  async function signOut() {
    setSigningOut(true);
    setError("");

    try {
      const response = await fetch("/api/employees/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to sign out. Please try again.");
      }

      localStorage.removeItem("employee");
      setEmployee(null);
      navigate("/employee/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <Link className="home-brand" to="/">
          FreshMart
        </Link>

        {employee && (
          <button
            className="home-button"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        )}
      </header>

      <main className="staff-main">
        <section className="staff-card">
          <h1>Employee Dashboard</h1>

          {loading && (
            <p role="status">Checking your login...</p>
          )}

          {error && (
            <div role="alert">
              <p>{error}</p>

              {!employee && (
                <button
                  className="home-button"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {employee && (
            <>
              <p>
                Welcome, {employee.FirstName} {employee.LastName}.
              </p>

              <p>Role: {employee.EmployeeRole}</p>

              <Link
                className="home-button"
                to="/employee/fulfillment"
              >
                Delivery &amp; Curbside Orders
              </Link>
              <Link
                className="home-button"
                to="/employee/inventory"
                style={{ marginLeft: "12px", display: "inline-block" }}
              >
              Inventory Stock Report
            </Link>
            <Link
              className="home-button"
          to="/employee/restock-requests"
  style={{ marginLeft: "12px", display: "inline-block" }}
>
  My Restock Requests
</Link>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

