import { useEffect, useState } from "react";

// Validate saved customer display data before restoring the app after refresh.
export default function CustomerSessionCheck({ children }) {
  const [status, setStatus] = useState(() =>
    sessionStorage.getItem("customer") ? "checking" : "ready",
  );

  useEffect(() => {
    if (!sessionStorage.getItem("customer")) return;
    const controller = new AbortController();
    async function verify() {
      try {
        const response = await fetch("/api/customers/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          sessionStorage.removeItem("customer");
          // A fresh load also discards profile and cart state held in memory.
          window.location.replace("/customer-login?notice=session-ended");
          return;
        }
        setStatus(response.ok ? "ready" : "error");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }
    void verify();
    return () => controller.abort();
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
