import { Navigate, Outlet } from "react-router-dom";
import "../../css/manager/ManagerTheme.css";

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
  return (
    <div className="manager-theme">
      <Outlet />
    </div>
  );
}

export default ProtectedManagerRoute;
