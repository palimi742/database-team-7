import './App.css';
import {useState, useEffect} from 'react';

function Loyalty() {
    const customer = JSON.parse(localStorage.getItem('customer'));
    const [loyalty, setLoyalty] = useState(null);
    useEffect(() => {
        if(!customer) return;
        fetch(`http://localhost:3000/api/loyalty/${customer.CustomerID}`)
        .then(response => response.json())
        .then(data => {
            setLoyalty(data);
        })
        .catch(error => {
            console.error('Error fetching loyalty status:', error);
        });
    }, [customer]);

    async function joinLoyalty() {
    const response = await fetch('http://localhost:3000/api/loyalty/join', {
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
    }
    return (
         <div className="loyalty-container">
            <h1>Freshmart Rewards</h1>
            <p>Shop and earn points!</p>

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