import '../css/App.css'
import {useState} from 'react';

function Signup(){
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    async function handleSignup() {
        try {
        const response = await fetch('/api/customers/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                customerAddress: address,
                username: username,
                password: password
            })
        });

        const data = await response.json();
        alert(data.message);
        } catch {
            alert('Unable to reach the backend. Check that it is running and the database is configured.');
        }
    }
    return(
    <div className="signup-container">
        <div className="signup-card">
            <h1>FreshMart POS</h1>
            <h2>Create Your Account</h2>
            <p>Sign up to get started</p>
            <input type="text" 
            placeholder="First name" 
            onChange = {(event) => setFirstName(event.target.value)}/>
            <input type="text" placeholder="Last name"
            onChange = {(event) => setLastName(event.target.value)}/>
            <input type="tel" placeholder="Phone number" 
            onChange = {(event) => setPhoneNumber(event.target.value)}/>
            <input type="text" placeholder="Address" 
            onChange = {(event) => setAddress(event.target.value)} />
            <input type="text" placeholder="Username" 
            onChange = {(event) => setUsername(event.target.value)}/>
            <input type="password" placeholder="Password" 
            onChange = {(event) => setPassword(event.target.value)}/>
            <button onClick={handleSignup}>Create Account</button>
            <p>Already have an account? <a href="/">Log in</a></p>
        </div>
    </div>
    );
}

export default Signup
