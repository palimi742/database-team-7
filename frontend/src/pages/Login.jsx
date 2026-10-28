import '../css/App.css';
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
      <p>{role === 'customer' ? 'Sign in to access your workspace.' : `${role === 'manager' ? 'Manager' : 'Employee'} sign in`}</p>
      {role === 'employee' ? (
        <p>Employee sign-in is coming soon.</p>
      ) : (
        <form onSubmit={handleLogin}>
          <input type="text"
            aria-label="Username"
            autoComplete="username"
            placeholder="Enter your username"
            onChange={(event) => setUsername(event.target.value)} />
          <input type="password"
            aria-label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            onChange={(event) => setPassword(event.target.value)} />
          <button className="signin-btn" type="submit">Sign In</button>
        </form>
      )}
      {role === 'customer' && <p>Dont have an account? <Link to="/signup">Sign up</Link></p>}
      <div className="login-links">
        <Link to="/employee/login">Employee sign in</Link>
        <Link to="/manager/login">Manager sign in</Link>
      </div>
      {role !== 'customer' && <p><Link to="/">Back to customer sign in</Link></p>}
    </div>
  </div>
  );
}
export default Login;
