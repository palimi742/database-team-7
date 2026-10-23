import './App.css';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

function Login(){
    const [selectedRole, setSelectedRole] = useState('customer');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    async function handleLogin(){
        try{
            const endpoint =
            selectedRole === 'customer'
                ? 'http://localhost:3000/api/customers/login'
                : 'http://localhost:3000/api/employees/login';
            const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
          const data = await response.json();
          if (!response.ok) {
            alert(data.message);
            return;
        }
          if(selectedRole === 'customer'){
            localStorage.setItem('customer', JSON.stringify(data.customer));
            navigate('/browse');
          }else{
            localStorage.setItem(
                'employee',
                JSON.stringify(data.employee)
            );
            const role = data.employee.EmployeeRole.toLowerCase();

            if (role === 'manager') {
                 navigate('/manager');
            } else if (role === 'delivery') {
                 navigate('/deliveries');
            } else {
                 alert('Unrecognized employee role: ' + data.employee.EmployeeRole);
            }
          }
    } catch(error) {
        console.error('Login error: ', error);
        alert('Unable to connect to the server. Please try again.')
    }
    }
        
  return(
   <div className="login-container">
    <div className="login-card">
      <h1>FreshMart POS.</h1>
      <h2>Welcome back.</h2>
      <p>Sign in to access your workspace.</p>
      <h3>I am signing in as a...</h3>
      <div className="role-buttons">
        <button className='role-btn customer-btn' onClick={() => setSelectedRole('customer')}>Customer</button>
        <button className = 'role-btn employee-btn' onClick={() => setSelectedRole('employee')}>Employee</button>
      </div>
      <input type="text" 
      placeholder="Enter your username"
      onChange = {(event) => setUsername(event.target.value)} />
      <input type="password"
       placeholder="Enter your password" 
       onChange = {(event) => setPassword(event.target.value)}/>
      <button className="signin-btn" onClick={handleLogin}>Sign In</button>
      <p>Dont have an account?<a href='/signup'>Sign up</a></p>
    </div>
  </div>
  );
}
export default Login;
