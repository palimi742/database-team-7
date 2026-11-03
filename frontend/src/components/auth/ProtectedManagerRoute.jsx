import { Navigate, Outlet } from "react-router-dom";

function ProtectedManagerRoute() {
  let employee = null;

  try {
    employee = JSON.parse(localStorage.getItem("employee"));
  } catch {
    return <Navigate to="/manager/login" replace />;
  }

  if (
    employee === null ||
    typeof employee.EmployeeRole !== "string" ||
    employee.EmployeeRole.toLowerCase() !== "manager"
  ) {
    return <Navigate to="/manager/login" replace />;
  }
  return <Outlet />;
}

export default ProtectedManagerRoute;
