import { Navigate, Outlet } from "react-router-dom";

function ProtectedManagerRoute() {
  let employee = null;

  try {
    employee = JSON.parse(localStorage.getItem("employee"));
  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  if (
    employee === null ||
    typeof employee.EmployeeRole !== "string" ||
    employee.EmployeeRole.toLowerCase() !== "manager"
  ) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export default ProtectedManagerRoute;
