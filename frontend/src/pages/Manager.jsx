import { Link, Navigate } from 'react-router-dom';
import '../css/App.css';

export default function Manager() {
    let employee;
    try {
        employee = JSON.parse(localStorage.getItem('employee'));
    } catch {
        return <Navigate to="/" replace />;
    }
    if (employee?.EmployeeRole?.toLowerCase() !== 'manager') {
        return <Navigate to="/" replace />;
    }
    return (
        <div className="browse-container">
            <h1>Manager Workspace</h1>
            <p>Welcome, {employee.FirstName}.</p>
            <p>Inventory management is not available yet.</p>
            <Link to="/" onClick={() => localStorage.removeItem('employee')}>Sign out</Link>
        </div>
    );
}
