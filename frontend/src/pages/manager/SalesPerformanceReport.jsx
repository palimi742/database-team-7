import ReportExport from "../../components/reports/ReportExport.jsx";
import OrderReceipt from "../../components/orders/ManagerOrderReceipt.jsx";
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

function displayDate(value) {
  const parts = value.slice(0, 10).split("-");
  return parts[1] + "/" + parts[2] + "/" + parts[0];
}

function SalesTransactions({ transactions }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const start = (page - 1) * pageSize;
  const visible = transactions?.slice(start, start + pageSize) ?? [];
  const pageCount = Math.ceil((transactions?.length ?? 0) / pageSize);

  return (
    <section aria-labelledby="sales-transactions-heading">
      <h2 id="sales-transactions-heading">Transactions</h2>
      {transactions?.length > 0 && (
        <div className="loyalty-pagination">
          <p role="status">
            Showing {start + 1}–{start + visible.length} of{" "}
            {transactions.length} transactions
          </p>
          <label className="loyalty-page-size">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </label>
          {pageCount > 1 && (
            <nav aria-label="Transaction pages">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      )}
      <div className="sales-table">
        <table aria-labelledby="sales-transactions-heading">
          <thead>
            <tr>
              <th scope="col">Order ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Transaction date</th>
              <th scope="col">Order total</th>
              <th scope="col" className="report-receipt-column">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5}>
                  {transactions
                    ? "No transactions in this date range."
                    : "Transaction details are unavailable."}
                </td>
              </tr>
            )}
            {transactions?.map((transaction, index) => (
              <tr
                key={transaction.TransactionID}
                className={
                  index < start || index >= start + pageSize
                    ? "report-print-row"
                    : undefined
                }
              >
                <th scope="row">#{transaction.TransactionID}</th>
                <td>
                  {[transaction.FirstName, transaction.LastName]
                    .filter(Boolean)
                    .join(" ") || "Unavailable"}
                </td>
                <td>{displayDate(transaction.TransactionDate)}</td>
                <td>${Number(transaction.TotalPrice).toFixed(2)}</td>
                <td className="report-receipt-column">
                  <button
                    type="button"
                    aria-label={`View order #${transaction.TransactionID}`}
                    onClick={() => setSelectedOrder(transaction.TransactionID)}
                  >
                    View order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder !== null && (
        <OrderReceipt
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </section>
  );
}

function SalesPerformanceReport() {
  const [report, setReport] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestedRange, setRequestedRange] = useState(null);
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

  const topSalesDays = [...(report?.DailySales ?? [])]
    .sort(
      (a, b) =>
        Number(b.TotalRevenue) - Number(a.TotalRevenue) ||
        a.TransactionDate.localeCompare(b.TransactionDate),
    )
    .slice(0, 5);

  const categoryTotal = categorySales.reduce(
    (total, category) => total + category.value,
    0,
  );

  function resetResults() {
    setRequestedRange(null);
    setReport(null);
    setError("");
    setLoading(false);
  }

  function runReport(event) {
    event.preventDefault();
    setRequestedRange({ startDate, endDate });
  }

  useEffect(() => {
    if (!requestedRange) return;
    const { startDate, endDate } = requestedRange;
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
  }, [requestedRange]);

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-page sales-performance-report printable-report">
        <h1>Sales Performance Report</h1>
        {report && requestedRange && (
          <ReportExport
            from={requestedRange.startDate}
            through={requestedRange.endDate}
            dateLabel="Transactions"
          />
        )}
        <form className="sales-report-form" onSubmit={runReport}>
          <div>
            <label htmlFor="sales-from">From</label>
            <input
              id="sales-from"
              type="date"
              value={startDate}
              min="1000-01-01"
              max={endDate || "9999-12-31"}
              onChange={(event) => {
                setStartDate(event.target.value);
                resetResults();
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="sales-through">Through</label>
            <input
              id="sales-through"
              type="date"
              value={endDate}
              min={startDate || "1000-01-01"}
              max="9999-12-31"
              onChange={(event) => {
                setEndDate(event.target.value);
                resetResults();
              }}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            Run report
          </button>
        </form>
        {loading && <p role="status">Loading sales report...</p>}
        {error && <p role="alert">{error}</p>}
        {!requestedRange && (
          <p>Choose a date range and run the report to view sales.</p>
        )}
        {report && (
          <>
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
            <p className="sales-comparison-note report-screen-dates">
              Showing {displayDate(requestedRange.startDate)} through{" "}
              {displayDate(requestedRange.endDate)}.
            </p>
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
                              fill={
                                categoryColors[index % categoryColors.length]
                              }
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
                              categoryTotal > 0
                                ? (value / categoryTotal) * 100
                                : 0;
                            return (
                              <span style={{ color: "#18251c" }}>
                                {name}: {percent.toFixed(1)}% ($
                                {value.toFixed(2)})
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
                <h2>Top 5 Sales Days</h2>
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
                      ) : topSalesDays.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            No transactions in this date range.
                          </td>
                        </tr>
                      ) : (
                        topSalesDays.map((day) => (
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
            <SalesTransactions transactions={report.Transactions} />
          </>
        )}
      </div>
    </div>
  );
}

export default SalesPerformanceReport;
