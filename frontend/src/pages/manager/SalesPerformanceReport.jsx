import { managerFetch } from "../../api.js";
import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/SalesPerformanceReport.css";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

function SalesPerformanceReport() {
  const [report, setReport] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const [weekStart, setWeekStart] = useState(getWeekStartDate);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const categoryColors = [
    "#33A8C7",
    "#F77976",
    "#9336FD",
    "#A0E426",
    "#FFAB00",
    "#F050AE",
    "#52E3E1",
    "#D883FF",
    "#FDF148",
  ];
  const categorySales = (report?.CategorySales || []).map((category) => ({
    name: category.CategoryName,
    value: Number(category.SalesAmount),
  }));

  const categoryTotal = categorySales.reduce(
    (total, category) => total + category.value,
    0,
  );

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

  function displayDate(value) {
    const parts = value.slice(0, 10).split("-");
    return parts[1] + "-" + parts[2] + "-" + parts[0];
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
  }

  function goToCurrentWeek() {
    setWeekStart(getWeekStartDate());
  }

  const startDate = formatDate(weekStart);
  const endDate = formatDate(weekEnd);

  useEffect(() => {
    const controller = new AbortController();
    async function loadReport() {
      setLoading(true);
      setError("");
      setReport(null);
      try {
        const res = await managerFetch(
          `/api/manager/reports/sales-performance?startDate=${startDate}&endDate=${endDate}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Unable to load sales report.");
        if (!controller.signal.aborted) setReport(data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load sales report.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadReport();
    return () => controller.abort();
  }, [startDate, endDate]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadOverview() {
      try {
        const res = await managerFetch(
          "/api/manager/reports/sales-performance/overview",
          {
            signal: controller.signal,
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            data.message || "Unable to load all-time sales overview.",
          );
        if (!controller.signal.aborted) setOverview(data);
      } catch (err) {
        if (!controller.signal.aborted) setOverviewError(err.message);
      }
    }
    loadOverview();
    return () => controller.abort();
  }, []);

  function formatMoney(value) {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function weekComparison(field, currency = false) {
    if (!report?.PreviousWeek) return null;
    const current = Number(report[field]);
    const previous = Number(report.PreviousWeek[field]);
    const difference = current - previous;
    const amount = currency
      ? "$" + Math.abs(difference).toFixed(2)
      : Math.abs(difference);
    let text = "No change vs previous week";
    if (difference !== 0) {
      text = amount + (difference > 0 ? " higher" : " lower");
      if (previous !== 0) {
        text +=
          " (" + ((Math.abs(difference) / previous) * 100).toFixed(1) + "%)";
      } else {
        text += " (previous week: 0)";
      }
      text += " vs previous week";
    }
    return (
      <small
        className={
          difference > 0
            ? "sales-change-up"
            : difference < 0
              ? "sales-change-down"
              : "sales-change-neutral"
        }
      >
        {text}
      </small>
    );
  }

  const today = formatDate(new Date());
  const weekInProgress = today >= startDate && today <= endDate;

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-main-dashboard sales-performance-report">
        <h1>Sales Performance Report</h1>
        <div className="sales-all-time">
          <h2>All-Time Sales Overview</h2>
          {overviewError ? (
            <p role="alert">{overviewError}</p>
          ) : !overview ? (
            <p role="status">Loading all-time sales...</p>
          ) : (
            <div className="sales-table">
              <table>
                <thead>
                  <tr>
                    <th>Total Revenue</th>
                    <th>Total Transactions</th>
                    <th>Average Transaction Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatMoney(overview.TotalRevenue)}</td>
                    <td>
                      {Number(overview.TransactionCount).toLocaleString(
                        "en-US",
                      )}
                    </td>
                    <td>{formatMoney(overview.AverageTransactionValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
        <h2>Weekly Sales</h2>
        <div className="sales-report-form">
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
          <div className="sales-week-controls">
            <button type="button" onClick={() => changeWeek(-7)}>
              Previous week
            </button>
            <span>
              {displayDate(formatDate(weekStart))} - {""}
              {displayDate(formatDate(weekEnd))}
            </span>
            <button type="button" onClick={() => changeWeek(7)}>
              Next week
            </button>
            <button type="button" onClick={goToCurrentWeek}>
              Current Week
            </button>
          </div>
        </div>
        <h2 className="sales-selected-week">
          Week of {displayDate(startDate)} through {displayDate(endDate)}
        </h2>
        {loading && <p role="status">Loading sales report...</p>}
        {error && <p role="alert">{error}</p>}
        <div className="sales-report">
          <div className="sales-report-data">
            <h2>Sales Revenue</h2>
            <p>
              {report === null
                ? "N/A"
                : `$${Number(report.TotalRevenue).toFixed(2)}`}
            </p>
            {weekComparison("TotalRevenue", true)}
          </div>
          <div className="sales-report-data">
            <h2>Transactions</h2>
            <p>{report === null ? "N/A" : report.TransactionCount}</p>
            {weekComparison("TransactionCount")}
          </div>
          <div className="sales-report-data">
            <h2>Average Transaction Value</h2>
            <p>
              {report === null
                ? "N/A"
                : `$${Number(report.AverageTransactionValue).toFixed(2)}`}
            </p>
            {weekComparison("AverageTransactionValue", true)}
          </div>
        </div>
        {report && (
          <p className="sales-comparison-note">
            Showing {displayDate(startDate)} - {displayDate(endDate)}, compared
            with previous week.
            {weekInProgress && " The selected week is in progress."}
          </p>
        )}
        <div className="sales-chart-and-daily">
          <div className="sales-category-section">
            <h2>Merchandise sales by category</h2>
            <p>Item sales before loyalty discounts.</p>
            {categorySales.length > 0 ? (
              <div className="sales-category-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      dataKey="value"
                      nameKey="name"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {categorySales.map((category, index) => (
                        <Cell
                          key={category.name}
                          fill={categoryColors[index % categoryColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const percent =
                          categoryTotal > 0
                            ? (Number(value) / categoryTotal) * 100
                            : 0;
                        return [
                          `$${Number(value).toFixed(2)} (${percent.toFixed(1)}%)`,
                          name,
                        ];
                      }}
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #dce1e7",
                        color: "#18251c",
                      }}
                      itemStyle={{ color: "#18251c" }}
                    />
                    <Legend
                      formatter={(name) => {
                        const category = categorySales.find(
                          (item) => item.name === name,
                        );
                        const value = category?.value || 0;
                        const percent =
                          categoryTotal > 0 ? (value / categoryTotal) * 100 : 0;
                        return (
                          <span style={{ color: "#18251c" }}>
                            {name}: {percent.toFixed(1)}% (${value.toFixed(2)})
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>
                {loading
                  ? "Loading category sales..."
                  : error
                    ? "Category sales unavailable."
                    : "No category sales to display."}
              </p>
            )}
          </div>
          <div className="sales-daily-section">
            <h2>Daily Sales</h2>
            <div className="sales-table">
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
                      <td colSpan={4}>
                        {loading ? "Loading..." : "Report unavailable."}
                      </td>
                    </tr>
                  ) : report.DailySales.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No transactions during this week.</td>
                    </tr>
                  ) : (
                    report.DailySales.map((day) => (
                      <tr key={day.TransactionDate}>
                        <td>{displayDate(day.TransactionDate)}</td>
                        <td>${Number(day.TotalRevenue).toFixed(2)}</td>
                        <td>{day.TransactionCount}</td>
                        <td>
                          ${Number(day.AverageTransactionValue).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="sales-promotion-section">
          <h2>Promotion Performance</h2>
          <p className="sales-comparison-note">
            Category merchandise sales during each offer’s days in the selected
            week, through today, compared with an equally long period
            immediately before those days. This compares sales during offers,
            not confirmed coupon use or sales caused by an offer. Offers can
            overlap and share the same sales. Daily records cannot distinguish
            partial days.
          </p>
          <div className="sales-table">
            <table>
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Category</th>
                  <th>Periods Compared</th>
                  <th>Sales During</th>
                  <th>Sales Before</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {report === null ? (
                  <tr>
                    <td colSpan={6}>
                      {loading ? "Loading..." : "Report unavailable."}
                    </td>
                  </tr>
                ) : !report.Promotions?.length ? (
                  <tr>
                    <td colSpan={6}>
                      No promotions have run in this week yet.
                    </td>
                  </tr>
                ) : (
                  report.Promotions.map((promotion) => {
                    const change =
                      promotion.DuringSales - promotion.BeforeSales;
                    let changeText = "No change";
                    if (promotion.BeforeSales === 0 && change > 0) {
                      changeText = "No prior sales";
                    } else if (change !== 0) {
                      changeText =
                        (change > 0 ? "+" : "−") +
                        (
                          (Math.abs(change) / promotion.BeforeSales) *
                          100
                        ).toFixed(1) +
                        "%";
                    }
                    return (
                      <tr key={promotion.OfferType + promotion.id}>
                        <td>
                          {promotion.OfferName}
                          <br />
                          <small>{promotion.OfferType}</small>
                        </td>
                        <td>{promotion.CategoryName}</td>
                        <td>
                          {displayDate(promotion.PeriodStart)} –{" "}
                          {displayDate(promotion.PeriodEnd)}
                          <br />
                          <small>
                            Before: {displayDate(promotion.BeforeStart)} –{" "}
                            {displayDate(promotion.BeforeEnd)}
                          </small>
                        </td>
                        <td>${promotion.DuringSales.toFixed(2)}</td>
                        <td>${promotion.BeforeSales.toFixed(2)}</td>
                        <td
                          className={
                            change > 0
                              ? "sales-change-up"
                              : change < 0
                                ? "sales-change-down"
                                : "sales-change-neutral"
                          }
                        >
                          {changeText}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2>Top 10 Best-Selling Products</h2>
          <p>Ranked by quantity sold</p>
          <div className="sales-table">
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
                    <td colSpan={4}>
                      {loading ? "Loading..." : "Report unavailable."}
                    </td>
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
    </div>
  );
}

export default SalesPerformanceReport;
