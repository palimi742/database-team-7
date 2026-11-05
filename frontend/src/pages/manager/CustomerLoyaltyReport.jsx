import { managerFetch } from "../../api.js";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import ManagerSidebar from "../../components/layout/ManagerSidebar";
import "../../css/manager/ManagerDashboard.css";
import "../../css/manager/CustomerLoyaltyReport.css";

function CustomerLoyaltyReport() {
  const [summary, setSummary] = useState([]);
  const [minPoints, setMinPoints] = useState("0");
  const [joinedAfter, setJoinedAfter] = useState("");
  const [joinedBefore, setJoinedBefore] = useState("");
  const [appliedMinPoints, setAppliedMinPoints] = useState("0");
  const [appliedJoinedAfter, setAppliedJoinedAfter] = useState("");
  const [appliedJoinedBefore, setAppliedJoinedBefore] = useState("");

  const filteredCustomers = summary.filter((customer) => {
    const joinedDate = new Date(customer.DateJoined);

    if (joinedAfter && joinedDate < new Date(joinedAfter)) {
      return false;
    }

    if (joinedBefore && joinedDate > new Date(joinedBefore)) {
      return false;
    }

    return true;
  });

  const customersByPurchases = filteredCustomers.slice().sort((a, b) => {
    return Number(b.PurchaseCount || 0) - Number(a.PurchaseCount || 0);
  });

  const customersBySpending = filteredCustomers.slice().sort((a, b) => {
    return Number(b.totalSpending || 0) - Number(a.totalSpending || 0);
  });

  const topCustomers = filteredCustomers
    .slice()
    .sort((a, b) => Number(b.totalSpending) - Number(a.totalSpending))
    .slice(0, 5);

  async function loadSummary() {
    try {
      const res = await managerFetch(
        `/api/reports/loyalty/summary?minPoints=${minPoints}`,
      );
      const data = await res.json();

      setAppliedMinPoints(minPoints);
      setAppliedJoinedAfter(joinedAfter);
      setAppliedJoinedBefore(joinedBefore);
      setSummary(data);
    } catch (err) {
      console.error("Error loading loyalty summary:", err);
    }
  }
  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      <ManagerSidebar />
      <div className="manager-main-dashboard customer-loyalty-report">
        <h1>Customer Loyalty and Rewards Report</h1>
        <h2>Loyalty Program Overview</h2>

        <div className="report-filters">
          <label htmlFor="minPoints">
            Minimum Points Earned
            <input
              id="minPoints"
              type="number"
              min="0"
              value={minPoints}
              onChange={(e) => setMinPoints(e.target.value)}
            />
          </label>

          <label>
            Joined after:
            <input
              type="date"
              value={joinedAfter}
              onChange={(e) => setJoinedAfter(e.target.value)}
            />
          </label>

          <label>
            Joined before:
            <input
              type="date"
              value={joinedBefore}
              onChange={(e) => setJoinedBefore(e.target.value)}
            />
          </label>



          <button onClick={loadSummary}>Generate Report</button>
        </div>

        <div className="loyalty-summary">
          <div className="report-summary-card">
            <h3>Total Loyalty Members</h3>
            <p>{filteredCustomers.length}</p>
          </div>
          <div className="report-summary-card">
            <h3>Total Points Earned</h3>
            <p>
              {filteredCustomers.reduce(
                (total, customer) => total + Number(customer.TotalPointsEarned),
                0,
              )}
            </p>
          </div>
          <div className="report-summary-card">
            <h3>Total Points Redeemed</h3>
            <p>
              {filteredCustomers.reduce(
                (total, customer) =>
                  total + Number(customer.TotalPointsRedeemed),
                0,
              )}
            </p>
          </div>
          <div className="report-summary-card">
            <h3>Total Customer Spending</h3>
            <p>
              $
              {filteredCustomers
                .reduce(
                  (total, customer) =>
                    total + Number(customer.totalSpending || 0),
                  0,
                )
                .toFixed(2)}
            </p>
          </div>
        </div>

        <h2>Top 5 customers by spending</h2>
        <div className="loyalty-top-customers">
          <div className="loyalty-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCustomers} layout="vertical">
              <XAxis type="number" tick={{ fill: "#ccc" }} />
              <YAxis type="category" dataKey={(customer) => customer.FirstName + " " + customer.LastName} width={160} tick={{ fill: "#eee" }} />
              <Bar
                dataKey="totalSpending"
                fill="#23e95f"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        <h2>Loyalty Member Details</h2>
        <p className="loyalty-savings-note">
          Loyalty savings = points redeemed ÷ {summary[0]?.pointsPerRewardDollar || 50}.
          Older sample redemptions are valued at this rate.
        </p>
        <div className="loyalty-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Purchases</th>
                <th>Total Spending</th>
                <th>Average per Purchase</th>
                <th>Loyalty Savings Used</th>
                <th>Current Points</th>
                <th>Points Earned</th>
                <th>Points Redeemed</th>
              </tr>
            </thead>
            <tbody>
              {customersByPurchases.map((customer) => (
                <tr key={customer.CustomerID}>
                  <td>{customer.FirstName} {customer.LastName}</td>
                  <td>{customer.PurchaseCount}</td>
                  <td>${Number(customer.totalSpending || 0).toFixed(2)}</td>
                  <td>{Number(customer.PurchaseCount) > 0
                    ? "$" + (Number(customer.totalSpending || 0) / Number(customer.PurchaseCount)).toFixed(2)
                    : "—"}</td>
                  <td>${Number(customer.loyaltySavings || 0).toFixed(2)}</td>
                  <td>{customer.CurrentPoints}</td>
                  <td>{customer.TotalPointsEarned}</td>
                  <td>{customer.TotalPointsRedeemed}</td>
                </tr>
              ))}
              {!filteredCustomers.length && (
                <tr><td colSpan={8}>No members match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <h2>Customer Coupon Usage</h2>
        <p className="loyalty-savings-note">
          Estimated coupon savings use the current discount values of coupons marked used.
          Loyalty rewards and seasonal-sale savings are excluded.
        </p>
        <div className="loyalty-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Coupons Used</th>
                <th>Estimated Coupon Savings</th>
              </tr>
            </thead>
            <tbody>
              {customersBySpending.map((customer) => (
                <tr key={customer.CustomerID}>
                  <td>{customer.FirstName} {customer.LastName}</td>
                  <td>{Number(customer.couponsUsed || 0)}</td>
                  <td>${Number(customer.couponSavings || 0).toFixed(2)}</td>
                </tr>
              ))}
              {!filteredCustomers.length && (
                <tr><td colSpan={3}>No members match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerLoyaltyReport;
