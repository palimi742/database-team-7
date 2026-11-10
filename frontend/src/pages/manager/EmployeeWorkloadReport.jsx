import { useState } from "react";
import { managerFetch } from "../../api.js";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/EmployeeWorkloadReport.css";

const payRate = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const hours = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function formatHireDate(value) {
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

function EmployeeResults({ employees }) {
  if (!employees.length) {
    return <p role="status">No employees were hired in this date range.</p>;
  }

  // Sum the same rounded hours shown in the table.
  const totalHundredths = employees.reduce(
    (total, employee) =>
      total + Math.round(employee.WeeklyScheduledSeconds / 36),
    0,
  );

  return (
    <section aria-labelledby="employee-report-summary">
      <h2 id="employee-report-summary" className="employee-report-summary">
        <span>
          <strong>{employees.length}</strong>{" "}
          {employees.length === 1 ? "employee" : "employees"}
        </span>{" "}
        <span>
          <strong>{hours.format(totalHundredths / 100)}</strong> weekly schedule
          hours
        </span>
      </h2>
      <p id="employee-report-hours-note" className="employee-report-note">
        The dates filter by hire date. Hours come from each employee’s recurring
        weekly schedule.
      </p>
      <div className="employee-report-table">
        <table
          aria-labelledby="employee-report-summary"
          aria-describedby="employee-report-hours-note"
        >
          <thead>
            <tr>
              <th scope="col">Employee ID</th>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Hire date</th>
              <th scope="col">Pay rate</th>
              <th scope="col">Weekly schedule (hours)</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.EmployeeID}>
                <td>{employee.EmployeeID}</td>
                <th scope="row">
                  {employee.FirstName} {employee.LastName}
                </th>
                <td>{employee.EmployeeRole}</td>
                <td>{formatHireDate(employee.EmployeeHireDate)}</td>
                <td>{payRate.format(employee.EmployeePay)}/hr</td>
                <td>
                  {hours.format(
                    Math.round(employee.WeeklyScheduledSeconds / 36) / 100,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function EmployeeWorkloadReport() {
  const [dates, setDates] = useState({ hiredSince: "", asOf: "" });
  const [employees, setEmployees] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeDate(field, value) {
    setDates((previous) => ({ ...previous, [field]: value }));
    setEmployees(null);
    setError("");
  }

  async function runReport(event) {
    event.preventDefault();
    setLoading(true);
    setEmployees(null);
    setError("");

    try {
      const response = await managerFetch(
        `/api/manager/reports/employee-workload?${new URLSearchParams(dates)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load employee report.");
      }
      setEmployees(data.employees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ManagerSidebar />
      <main className="manager-page employee-workload-report">
        <h1>Employee Report</h1>
        <form className="employee-hire-filters" onSubmit={runReport}>
          <div>
            <label htmlFor="hired-since">Hired from</label>
            <input
              id="hired-since"
              type="date"
              required
              disabled={loading}
              value={dates.hiredSince}
              max={dates.asOf || undefined}
              onChange={(event) => changeDate("hiredSince", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="hired-through">Hired through</label>
            <input
              id="hired-through"
              type="date"
              required
              disabled={loading}
              value={dates.asOf}
              min={dates.hiredSince || undefined}
              onChange={(event) => changeDate("asOf", event.target.value)}
            />
          </div>
          <button disabled={loading} type="submit">
            Run report
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
        {loading && <p role="status">Loading employee report…</p>}
        {!loading && !error && !employees && (
          <p className="employee-report-note">
            Choose a hire date range to run the report.
          </p>
        )}
        {employees && <EmployeeResults employees={employees} />}
      </main>
    </div>
  );
}
