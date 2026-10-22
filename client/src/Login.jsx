import './App.css';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    async function handleLogin(){
        const response = await fetch('http://localhost:3000/api/customers/login', {
          
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
          console.log(data);
          alert(data.message);
          if(response.ok){
            localStorage.setItem('customer', JSON.stringify(data.customer));
            navigate('/browse');
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
        <button className='role-btn customer-btn'>Customer</button>
        <button className = 'role-btn employee-btn'>Employee</button>
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
