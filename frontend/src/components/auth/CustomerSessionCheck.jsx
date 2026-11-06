import { useEffect, useState } from "react";

// The signed cookie is shared across tabs; sessionStorage is only display data.
export default function CustomerSessionCheck({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();
    let checking = false;
    let initialized = false;
    async function verify() {
      if (checking) return;
      checking = true;
      try {
        const response = await fetch("/api/customers/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const previous = sessionStorage.getItem("customer");
        if (response.status === 401) {
          sessionStorage.removeItem("customer");
          if (previous) {
            window.location.replace("/customer-login?notice=session-ended");
            return;
          }
        } else if (response.ok) {
          const customer = await response.json();
          if (controller.signal.aborted) return;
          let previousId = null;
          try { previousId = JSON.parse(previous)?.CustomerID; } catch { /* Invalid display data. */ }
          sessionStorage.setItem("customer", JSON.stringify(customer));
          if (initialized && previousId !== customer.CustomerID) {
            // Discard cart and order state belonging to the previous identity.
            window.location.reload();
            return;
          }
        } else {
          setStatus("error");
          return;
        }
        initialized = true;
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      } finally {
        checking = false;
      }
    }
    void verify();
    window.addEventListener("focus", verify);
    return () => {
      controller.abort();
      window.removeEventListener("focus", verify);
    };
  }, []);

  if (status === "checking") return <p role="status">Checking your session…</p>;
  if (status === "error") return (
    <main>
      <p role="alert">Unable to verify your session. Please try again.</p>
      <button type="button" onClick={() => window.location.reload()}>Try again</button>
    </main>
  );
  return children;
}
