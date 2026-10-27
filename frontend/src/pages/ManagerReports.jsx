import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar,
XAxis, YAxis,Tooltip,CartesianGrid} from "recharts";
import ManagerSidebar from "../components/ManagerSidebar";
import "../css/ManagerDashboard.css"

function ManagerReports() {
    const [locations, setLocations] = useState([]);
    const [summary, setSummary] = useState([]);
    const [minPoints, setMinPoints] = useState("0");
    const [joinedAfter, setJoinedAfter] = useState("")
    const [joinedBefore, setJoinedBefore] = useState("");
    const [selectedZip, setSelectedZip] = useState("");
    const [appliedZip, setAppliedZip] = useState("");
    const [appliedMinPoints, setAppliedMinPoints] = useState("0");
    const [appliedJoinedAfter, setAppliedJoinedAfter] = useState("");
    const [appliedJoinedBefore, setAppliedJoinedBefore] = useState("");

    const filteredCustomers = summary.filter((customer) => {
        
        if (
            selectedZip &&
            !customer.CustomerAddress?.includes(selectedZip)
        ) {
            return false;
        }
        if (
        appliedZip &&
        !customer.CustomerAddress?.includes(appliedZip)
        ) {
        return false;
        }

        
        const joinedDate = new Date(customer.DateJoined);

        if (joinedAfter && joinedDate < new Date(joinedAfter)) {
            return false;
        }

        if (joinedBefore && joinedDate > new Date(joinedBefore)) {
            return false;
        }

        return true;
    });

    const topCustomers = filteredCustomers
        .slice()
        .sort(
            (a, b) =>
                Number(b.totalSpending) - Number(a.totalSpending)
        )
        .slice(0, 5);

    
    async function loadSummary() {
        
        try {
            const res = await fetch(`/api/reports/loyalty/summary?minPoints=${minPoints}`);
            const data = await res.json();

            setAppliedMinPoints(minPoints);
            setAppliedJoinedAfter(joinedAfter);
            setAppliedJoinedBefore(joinedBefore);
            setAppliedZip(selectedZip);
            setSummary(data);
        } catch (err) {
            console.error("Error loading loyalty summary:", err);
        }
    }
    async function loadLocations() {
        try {
            const res = await fetch("/api/reports/loyalty/locations");
            const data = await res.json();
            setLocations(data);
        } catch (err) {
            console.error("Error loading loyalty locations:", err);
        }
    }
    useEffect(() => {
            loadSummary();
            loadLocations();
    }, []);


    return (
        <div>
            <ManagerSidebar />

            <div className="manager-main-dashboard">
                <h1>Manager Reports</h1>
                <h2>Loyalty Program Overview</h2>

            <div className="report-filters">
                <label htmlFor="minPoints">
                    Minimum Points Earned:
                </label>
                <input
                    id="minPoints"
                    type="number"
                    min="0"
                    value={minPoints}
                    onChange={(e) => setMinPoints(e.target.value)}
                />

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

                <label>
                    Filter by ZIP code:
                    <select
                        value={selectedZip}
                        onChange={(e) => setSelectedZip(e.target.value)}
                    >
                        <option value="">All ZIP codes</option>
                        {locations.map((location) => (
                            <option key={location.ZipCode} value={location.ZipCode}>
                                {location.ZipCode}
                            </option>
                        ))}
                    </select>
                </label>

                <button onClick={loadSummary}>
                    Generate Report
                </button>
            </div>

                <div className="report-summary-card">
                    <h3>Total Loyalty Members</h3>
                    <p>{filteredCustomers.length}</p>
                </div>
                <div className="report-summary-card">
                    <h3>Total Points Earned</h3>
                    <p>
                        {filteredCustomers.reduce(
                            (total, customer) => total + Number(customer.TotalPointsEarned),
                            0
                        )}
                    </p>
                </div>
                <div className="report-summary-card">
                    <h3>Total Points Redeemed</h3>
                    <p>
                        {filteredCustomers.reduce(
                            (total, customer) => total + Number(customer.TotalPointsRedeemed),
                            0
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
                                0
                            )
                            .toFixed(2)}
                    </p>
                </div>
                
                <h2>Top 5 Loyalty Customers</h2>
                
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={topCustomers}
                            layout="vertical"
                        >
                            <XAxis type="number" />
                            <YAxis
                                type="category"
                                dataKey="FirstName"
                                width={100}
                            />
                            <Bar
                                dataKey="totalSpending"
                                fill="#6B9C7A"
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>


                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Customer</th>
                            <th>Total Spending</th>
                            <th>Points Earned</th>
                        </tr>
                    </thead>
                    <tbody>
                        
                        {topCustomers.map((customer, index) => (
                            <tr key={customer.CustomerID}>
                                <td>{index + 1}</td>
                                <td>
                                    {customer.FirstName} {customer.LastName}
                                </td>
                                <td>${Number(customer.totalSpending || 0).toFixed(2)}</td>
                                <td>{customer.TotalPointsEarned}</td>
                            </tr>
                        ))}

                    </tbody>
                </table>

                <table>
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Current Points</th>
                            <th>Points Earned</th>
                            <th>Points Redeemed</th>
                            <th>Purchases</th>
                            <th>Total Spending</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                                <tr key={customer.CustomerID}>
                                    <td>{customer.FirstName} {customer.LastName}</td>
                                    <td>{customer.CurrentPoints}</td>
                                    <td>{customer.TotalPointsEarned}</td>
                                    <td>{customer.TotalPointsRedeemed}</td>
                                    <td>{customer.PurchaseCount}</td>
                                    <td>${Number(customer.totalSpending || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ManagerReports;