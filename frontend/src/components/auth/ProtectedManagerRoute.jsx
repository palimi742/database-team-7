import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../../css/manager/ManagerTheme.css";

function ProtectedManagerRoute() {
  const [access, setAccess] = useState({ path: null, status: "checking" });
  const dialog = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    let denied = false;
    function deny(status) {
      denied = true;
      localStorage.removeItem("employee");
      localStorage.removeItem("manager");
      setAccess({ path: pathname, status: status === 403 ? "forbidden" : "signin" });
    }
    function onDenied(event) { deny(event.detail); }
    async function verify() {
      try {
        const response = await fetch("/api/manager/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted || denied) return;
        if (response.status === 401 || response.status === 403) {
          deny(response.status);
        } else {
          setAccess({ path: pathname, status: response.ok ? "allowed" : "error" });
        }
      } catch {
        if (!controller.signal.aborted && !denied) {
          setAccess({ path: pathname, status: "error" });
        }
      }
    }
    // Returning from the native file picker can refocus the window.
    // Revalidate without unmounting the current page while the request is pending.
    window.addEventListener("manager-access-denied", onDenied);
    window.addEventListener("pageshow", verify);
    window.addEventListener("focus", verify);
    void verify();
    return () => {
      controller.abort();
      window.removeEventListener("manager-access-denied", onDenied);
      window.removeEventListener("pageshow", verify);
      window.removeEventListener("focus", verify);
    };
  }, [pathname]);

  const status = access.path === pathname ? access.status : "checking";
  const showNotice = ["signin", "forbidden", "error"].includes(status);
  useEffect(() => {
    if (showNotice && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [showNotice]);

  return (
    <div className="manager-theme">
      {status === "allowed" ? <Outlet /> : (
        <p role="status">{status === "checking" ? "Checking your session…" : "Manager access is unavailable."}</p>
      )}
      {showNotice && (
        <dialog ref={dialog} className="manager-session-dialog"
          aria-labelledby="session-title" aria-describedby="session-description"
          onCancel={event => { event.preventDefault(); navigate("/login", { replace: true }); }}>
          <h2 id="session-title">{status === "forbidden" ? "Manager access required" : status === "error" ? "Unable to verify your session" : "Sign in required"}</h2>
          <p id="session-description">
            {status === "forbidden" ? "Please sign in with an active manager account to view this page."
              : status === "error" ? "We couldn’t check your session. Please try again shortly."
              : "Your session has expired or you’re signed out. Please sign in to continue."}
          </p>
          <button type="button" autoFocus onClick={() => navigate("/login", { replace: true })}>Go to sign in</button>
        </dialog>
      )}
    </div>
  );
}

export default ProtectedManagerRoute;
