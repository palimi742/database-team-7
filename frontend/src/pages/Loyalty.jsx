import '../css/App.css';
import {useState, useEffect} from 'react';

function Loyalty() {
    const [customer] = useState(() => JSON.parse(localStorage.getItem('customer')));
    const [error, setError] = useState('');
    const [loyalty, setLoyalty] = useState(null);
    useEffect(() => {
        if(!customer) return;
        fetch(`/api/loyalty/${customer.CustomerID}`)
        .then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to load rewards.');
            return data;
        })
        .then(data => {
            setLoyalty(data);
        })
        .catch(error => {
            setError(error.message);
        });
    }, [customer]);

    async function joinLoyalty() {
    try {
    const response = await fetch('/api/loyalty/join', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customerId: customer.CustomerID
        })
     });

    const data = await response.json();

     if (response.ok) {
        setLoyalty({
            isEnrolled: true,
            currentPoints: 0,
            totalPointsEarned: 0,
            totalPointsRedeemed: 0
        });
        alert(data.message);
        } else {
        alert(data.message);
    }
    } catch {
        setError('Unable to reach the backend.');
    }
    }
    return (
         <div className="loyalty-container">
            <h1>Freshmart Rewards</h1>
            <p>Shop and earn points!</p>
            {error && <p role="alert">{error}</p>}
            {!customer && <p>Please <a href="/">sign in</a> to view rewards.</p>}

            {loyalty && loyalty.isEnrolled && (
                <div className="rewards-dashboard">
                     <h2>Your Rewards</h2>
                      <h3>Current Points: {loyalty.currentPoints}</h3>
                      <p>Total Points Earned: {loyalty.totalPointsEarned}</p>
                      <p>Total Points Redeemed: {loyalty.totalPointsRedeemed}</p>
                </div>
            )}

            {loyalty && !loyalty.isEnrolled && (
                <button onClick={joinLoyalty}>Join Loyalty Program</button>
            )}
            
        </div>
    );
}

export default Loyalty;