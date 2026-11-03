import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || !username.trim() ||
        typeof password !== 'string' || !password) {
        return res.status(400).json({ message: 'Please enter both username and password' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT e.EmployeeID, ea.Username, e.FirstName, e.LastName, e.EmployeeRole
             FROM EmployeeAccounts AS ea
             JOIN Employee AS e ON ea.EmployeeID = e.EmployeeID
             WHERE ea.Username = ? AND ea.Password = ?
               AND ea.AccountStatus = 'Active' AND e.EmployeeRole = 'Manager'`,
            [username.trim(), password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid manager username or password' });
        }

        return res.json({ message: 'Logged in successfully', manager: rows[0] });
    } catch (error) {
        console.error('Manager login failed:', error.message);
        return res.status(500).json({ message: 'Unable to sign in. Please try again.' });
    }
});

export default router;
