import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerDashboard.css";
import "../css/SalesPerformanceReport.css";
import { useState, useEffect } from "react";

function SalesPerformanceReport() {
  const [report, setReport] = useState(null);
  const [weekStart, setWeekStart] = useState(getWeekStartDate);
  const [error, setError] = useState("");

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function getWeekStartDate() {
    const currentDay = new Date();
    const currentWeekDay = currentDay.getDay();
    let daysSinceMonday;

    if (currentWeekDay === 0) {
      daysSinceMonday = 6;
    } else {
      daysSinceMonday = currentWeekDay - 1;
    }
    currentDay.setDate(currentDay.getDate() - daysSinceMonday);
    return currentDay;
  }

  function changeWeek(days) {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + days);
    setWeekStart(newWeekStart);
    setReport(null);
    setError("");
  }

  function formatDate(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    return `${year}-${month}-${day}`;
  }

  function selectWeek(event) {
    const selectedDate = event.target.value;
    if (selectedDate === "") {
      return;
    }

    const newWeekStart = new Date(selectedDate + "T12:00:00");
    const weekday = newWeekStart.getDay();

    let daysSinceMonday;
    if (weekday === 0) {
      daysSinceMonday = 6;
    } else {
      daysSinceMonday = weekday - 1;
    }

    newWeekStart.setDate(newWeekStart.getDate() - daysSinceMonday);

    setWeekStart(newWeekStart);
    setReport(null);
    setError("");
  }

  function goToCurrentWeek() {
    setWeekStart(getWeekStartDate());
    setReport(null);
    setError("");
  }

  async function loadReport() {
    setError("");
    setReport(null);

    const startDate = formatDate(weekStart);
    const endDate = formatDate(weekEnd);
    try {
      const res = await fetch(
        `/api/manager/reports/sales-performance?startDate=${startDate}&endDate=${endDate}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }
      setReport(data);
    } catch (err) {
      setError(err.message);
    }
  }
  function handleSubmit(event) {
    event.preventDefault();
    loadReport();
  }

  useEffect(() => {
    loadReport();
  }, []);
  return (
    <div>
      <ManagerSidebar />
      <div className="manager-main-dashboard">
        <h1>Sales Performance Report</h1>
        <form className="sales-report-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="selectedWeek">Select Week</label>
            <input
              id="selectedWeek"
              type="date"
              value={formatDate(weekStart)}
              onChange={selectWeek}
              required
            />
          </div>
          <div>
            <button type="button" onClick={() => changeWeek(-7)}>
              Previous week
            </button>
            <span>
              {weekStart.toLocaleDateString()} - {""}
              {weekEnd.toLocaleDateString()}
            </span>
            <button type="button" onClick={() => changeWeek(7)}>
              Next week
            </button>
            <button type="button" onClick={goToCurrentWeek}>
              Current Week
            </button>
          </div>
          <div>
            <button type="submit">Generate Report</button>
          </div>
        </form>
        {error && <p>{error}</p>}
        <div className="sales-report">
          <div className="sales-report-data">
            <h2>Sales Revenue</h2>
            <p>
              {report === null
                ? "N/A"
                : `$${Number(report.TotalRevenue).toFixed(2)}`}
            </p>
          </div>
          <div className="sales-report-data">
            <h2>Transactions</h2>
            <p>{report === null ? "N/A" : report.TransactionCount}</p>
          </div>
          <div className="sales-report-data">
            <h2>Average Transaction Value</h2>
            <p>
              {report === null
                ? "N/A"
                : `$${Number(report.AverageTransactionValue).toFixed(2)}`}
            </p>
          </div>
        </div>
        <div>
          <h2>Daily Sales</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales Revenue</th>
                <th>Transactions</th>
                <th>Average Transaction Value</th>
              </tr>
            </thead>
            <tbody>
              {report === null ? (
                <tr>
                  <td colSpan={4}>Generate a report to view results.</td>
                </tr>
              ) : report.DailySales.length === 0 ? (
                <tr>
                  <td colSpan={4}>No transactions during this week.</td>
                </tr>
              ) : (
                report.DailySales.map((day) => (
                  <tr key={day.TransactionDate}>
                    <td>{day.TransactionDate.slice(0, 10)}</td>
                    <td>${Number(day.TotalRevenue).toFixed(2)}</td>
                    <td>{day.TransactionCount}</td>
                    <td>${Number(day.AverageTransactionValue).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div>
          <h2>Top 10 Best-Selling Products</h2>
          <p>Ranked by quantity sold</p>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Sales Amount</th>
              </tr>
            </thead>
            <tbody>
              {report === null ? (
                <tr>
                  <td colSpan={4}>Generate a report to view results.</td>
                </tr>
              ) : report.TopProducts.length === 0 ? (
                <tr>
                  <td colSpan={4}>No products sold during this week.</td>
                </tr>
              ) : (
                report.TopProducts.map((product, index) => (
                  <tr key={product.InventoryID}>
                    <td>{index + 1}</td>
                    <td>{product.InventoryName}</td>
                    <td>{product.UnitsSold}</td>
                    <td>${Number(product.SalesAmount).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesPerformanceReport;
