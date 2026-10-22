import './App.css';
import Login from './Login';
import Signup from './Signup';
import Browse from './Browse';
import Navbar from './Navbar';
import Loyalty from './Loyalty'
import {Routes, Route, Link} from "react-router-dom"
import {useState} from "react";
/*1.Browser: With cart on the side. (Kind of "employee page")
 2.Login:For customers and employees
 3. Employee Page 1: Managers- Restock things
 4. Employee Page 2: Curbside workers- Match to customers
 5.Old transactions for customer
*/

/*function Navbar(props){
  return(
    <h2>FreshMart, {props.title}!</h2>
  );
}



function Navbar(){
  return(
    <nav>
      <Link to="/">Freshmart</Link>
      <Link to="/transactions">Transactions</Link>
    </nav>
  );
}
*/

function Transactions(){
  return(
     <div>
      <Navbar/>
      <h1>Transactions</h1>
    </div>
  );
}

function App(){
  return(
   <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path='/signup' element={<Signup />}/>
      <Route path="/browse" element={<Browse/>} />
      <Route path="/transactions" element={<Transactions/>} />
      <Route path="/loyalty" element={<Loyalty />} />
   </Routes>
   /* <div>
      <Login></Login>
    </div>
    */
    
  );
}
export default App;