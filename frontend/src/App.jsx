import './css/App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Browse from './pages/Browse';
import Loyalty from './pages/Loyalty';
import Manager from './pages/Manager';
import Deliveries from './pages/Deliveries';
import Transactions from './pages/Transactions';

function App(){
  return(
   <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path='/signup' element={<Signup />}/>
      <Route path="/browse" element={<Browse/>} />
      <Route path="/transactions" element={<Transactions/>} />
      <Route path="/loyalty" element={<Loyalty />} />
      <Route path="/manager" element={<Manager />} />
      <Route path="/deliveries" element={<Deliveries />} />
   </Routes>

  );
}
export default App;
