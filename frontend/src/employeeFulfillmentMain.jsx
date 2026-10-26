import React from "react";
import { createRoot } from "react-dom/client";
import EmployeeFulfillment from "./pages/EmployeeFulfillment.jsx";

createRoot(
  document.getElementById("employee-fulfillment-root")
).render(
  <React.StrictMode>
    <EmployeeFulfillment />
  </React.StrictMode>
);


