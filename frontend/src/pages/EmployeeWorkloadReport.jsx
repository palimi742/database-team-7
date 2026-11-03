import { useEffect, useState } from "react";
import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerDashboard.css";
import "../css/SalesPerformanceReport.css";
import "../css/EmployeeWorkloadReport.css";

function dateInput(date) {
  const year = date.getFullYear();
  let month = String(date.getMonth() + 1);
  let day = String(date.getDate());

  if (month.length === 1) {
    month = "0" + month;
  }
  if (day.length === 1) {
    day = "0" + day;
  }
  return year + "-" + month + "-" + day;
}

function EmployeeTable({ employees, empty }) {
  return (
    <div className="employee-report-table">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Hire date</th>
            <th>Pay rate</th>
            <th>Scheduled hours / week</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.EmployeeID}>
              <td>
                {employee.FirstName} {employee.LastName}
              </td>
              <td>{employee.EmployeeRole}</td>
              <td>{employee.EmployeeHireDate}</td>
              <td>${Number(employee.EmployeePay).toFixed(2)}</td>
              <td>{Number(employee.WeeklyHours).toFixed(2)}</td>
            </tr>
          ))}
          {!employees.length && (
            <tr>
              <td colSpan={5}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default function EmployeeWorkloadReport() {
  const [dates, setDates] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return { hiredSince: dateInput(start), asOf: dateInput(today) };
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load(filters) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/manager/reports/employee-workload?${new URLSearchParams(filters)}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load employee report.");
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    load({ hiredSince: dateInput(start), asOf: dateInput(today) });
  }, []);
  return (
    <div>
      <ManagerSidebar />
      <main className="manager-main-dashboard employee-workload-report">
        <h1>Employee Workload Report</h1>
        <p>
          Employee counts and pay cover all employees. Recent hires default to
          the last 30 days.
        </p>
        <form
          className="sales-report-form"
          onSubmit={(event) => {
            event.preventDefault();
            load(dates);
          }}
        >
          <div>
            <label htmlFor="hired-since">Hired from</label>
            <input
              id="hired-since"
              type="date"
              required
              value={dates.hiredSince}
              max={dates.asOf}
              onChange={(event) =>
                setDates({ ...dates, hiredSince: event.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="hired-through">Hired through</label>
            <input
              id="hired-through"
              type="date"
              required
              value={dates.asOf}
              min={dates.hiredSince}
              onChange={(event) =>
                setDates({ ...dates, asOf: event.target.value })
              }
            />
          </div>
          <button disabled={loading} type="submit">
            {loading ? "Loading..." : "Run report"}
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
        {loading && <p role="status">Loading employee report...</p>}
        {!loading && !error && report && (
          <>
            <div className="sales-summary">
              {[
                ["Employees", report.employeeCount],
                ["Average salary / pay rate", "$" + Number(report.averageSalary).toFixed(2)],
                ["Highest salary / pay rate", "$" + Number(report.highestSalary).toFixed(2)],
                ["Scheduled hours / week", Number(report.weeklyHours).toFixed(2)],
                ["Recent hires", report.recentHires.length],
              ].map(([label, value]) => (
                <div className="sales-summary-card" key={label}>
                  <h2>{label}</h2>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            <p>
              Pay uses the stored EmployeePay rate; no annual salary conversion
              is applied. Hours come from weekly work schedules, including
              overnight shifts. Actual hours worked are unavailable because
              time-clock records are not stored.
            </p>
            <h2>
              Recently hired: {report.hiredSince} through {report.asOf}
            </h2>
            <EmployeeTable
              employees={report.recentHires}
              empty="No employees hired in this date range."
            />
            <h2>All employees and weekly hours</h2>
            <EmployeeTable
              employees={report.employees}
              empty="No employees to display."
            />
          </>
        )}
      </main>
    </div>
  );
}
