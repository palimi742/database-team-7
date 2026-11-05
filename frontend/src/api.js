export const LOGIN_URL = "/customer-login";

export async function logoutStaff() {
  await api("/api/employees/logout", "POST");
  localStorage.removeItem("employee");
  localStorage.removeItem("manager");
}

export async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const error = new Error(
        "The server returned an unexpected response. Check that the backend is running.",
      );
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message || "Unable to complete the request.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export function fmtDate(value) {
  if (!value) return "";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value,
  );
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US");
}

export function formatPhone(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  const hasCountryCode = digits.length === 11 && digits.startsWith("1");
  const localNumber = hasCountryCode ? digits.slice(1) : digits;
  if (localNumber.length !== 10) return phoneNumber || "";
  const formattedNumber = `${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
  return hasCountryCode ? `+1 ${formattedNumber}` : formattedNumber;
}

// Manager pages share one access-denied notice, even for concurrent requests.
export async function managerFetch(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    window.dispatchEvent(new CustomEvent("manager-access-denied", {
      detail: response.status,
    }));
  }
  return response;
}
