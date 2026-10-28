import '../css/App.css';
import Footer from '../components/Footer';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    async function handleLogin(){
        try {
        const response = await fetch('/api/customers/login', {
          
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
