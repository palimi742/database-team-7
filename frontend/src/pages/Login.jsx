import '../css/App.css';
import Footer from '../components/Footer';
import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

function Login({role = 'customer'}){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    async function handleLogin(event){
        event.preventDefault();
        if (role === 'employee') return;
        try {
        const response = await fetch(role === 'manager' ? '/api/manager/login' : '/api/customers/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password})
        });
          const data = await response.json();
          alert(data.message);
          if(response.ok){
            localStorage.removeItem(role === 'manager' ? 'customer' : 'manager');
            localStorage.setItem(role, JSON.stringify(data[role]));
            navigate(role === 'manager' ? '/manager' : '/browse');
          }
        } catch {
            alert('Unable to reach the backend. Check that it is running and the database is configured.');
        }
    }
  return(
   <div className="login-container">
    <div className="login-card">
      <h1>FreshMart POS.</h1>
      <h2>Welcome back.</h2>
      <p>Sign in to access your account.</p>
      <input type="text" 
      placeholder="Enter your username"
      onChange = {(event) => setUsername(event.target.value)} />
      <input type="password"
       placeholder="Enter your password" 
       onChange = {(event) => setPassword(event.target.value)}/>
      <button className="signin-btn" onClick={handleLogin}>Sign In</button>
      <p>Don't have an account? <a href='/signup'>Sign up</a></p>
      <Footer />
    </div>
  </div>
  );
}
export default Login;
