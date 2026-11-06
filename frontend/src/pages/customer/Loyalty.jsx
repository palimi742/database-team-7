import "../../css/App.css";
import { useState, useEffect } from "react";

function Loyalty() {
  const [customer] = useState(() =>
    JSON.parse(sessionStorage.getItem("customer")),
  );
  const [error, setError] = useState("");
  const [loyalty, setLoyalty] = useState(null);
  useEffect(() => {
    if (!customer) return;
    fetch("/api/loyalty")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Unable to load rewards.");
        return data;
      })
      .then((data) => {
        setLoyalty(data);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, [customer]);

  return (
    <div className="loyalty-container">
      <h1>Freshmart Rewards</h1>
      <p>Shop and earn points!</p>
      {error && <p role="alert">{error}</p>}
      {!customer && (
        <p>
          Please <a href="/">sign in</a> to view rewards.
        </p>
      )}

      {loyalty && loyalty.isEnrolled && (
        <div className="rewards-dashboard">
          <h2>Your Rewards</h2>
          <h3>Current Points: {loyalty.currentPoints}</h3>
          <p>Total Points Earned: {loyalty.totalPointsEarned}</p>
          <p>Total Points Redeemed: {loyalty.totalPointsRedeemed}</p>
        </div>
      )}

      {loyalty && !loyalty.isEnrolled && (
        <p role="status">Your account includes Freshmart Rewards. Your points balance is temporarily unavailable.</p>
      )}
    </div>
  );
}

export default Loyalty;
