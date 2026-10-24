import '../css/App.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const [selectedRole, setSelectedRole] = useState('customer');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(event) {
        event.preventDefault();
        setPending(true);
        try {
            const endpoint = selectedRole === 'customer'
                ? '/api/customers/login'
                : '/api/employees/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.message);
                return;
            }
            if (selectedRole === 'customer') {
                localStorage.removeItem('employee');
                localStorage.setItem('customer', JSON.stringify(data.customer));
                navigate('/browse');
            } else {
                const role = data.employee.EmployeeRole?.toLowerCase();
                const destination = { manager: '/manager', delivery: '/deliveries' }[role];
                if (!destination) {
                    alert('Unrecognized employee role: ' + data.employee.EmployeeRole);
                    return;
                }
                localStorage.removeItem('customer');
                localStorage.setItem('employee', JSON.stringify(data.employee));
                navigate(destination);
            }
        } catch {
            alert('Unable to reach the backend. Check that it is running and the database is configured.');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleLogin}>
                <h1>FreshMart POS.</h1>
                <h2>Welcome back.</h2>
                <p>Sign in to access your workspace.</p>
                <h3>I am signing in as a...</h3>
                <div className="role-buttons">
                    <button type="button" className="role-btn customer-btn"
                        aria-pressed={selectedRole === 'customer'} disabled={pending}
                        onClick={() => setSelectedRole('customer')}>Customer</button>
                    <button type="button" className="role-btn employee-btn"
                        aria-pressed={selectedRole === 'employee'} disabled={pending}
                        onClick={() => setSelectedRole('employee')}>Employee</button>
                </div>
                <input type="text" aria-label="Username" autoComplete="username"
                    placeholder="Enter your username" value={username} required
                    onChange={event => setUsername(event.target.value)} />
                <input type="password" aria-label="Password" autoComplete="current-password"
                    placeholder="Enter your password" value={password} required
                    onChange={event => setPassword(event.target.value)} />
                <button type="submit" className="signin-btn" disabled={pending}>
                    {pending ? 'Signing in...' : 'Sign In'}
                </button>
                <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
            </form>
        </div>
    );
}

export default Login;
