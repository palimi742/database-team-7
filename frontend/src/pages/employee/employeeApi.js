export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export async function employeeApi(path, options = {}) {
  const response = await fetch("/api/employee/" + path, {
    cache: "no-store",
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (response.status === 401) {
    localStorage.removeItem("employee");
    window.location.replace("/employee/login");
    throw new Error("Your session expired.");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to complete this request.");
  return data;
}