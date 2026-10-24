import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
        return res.status(400).json({
            message: "Please enter both username and password"
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT ea.EmployeeID, ea.Username, ea.Password,
                    ea.AccountStatus, e.FirstName, e.LastName,
                    e.EmployeeRole
             FROM EmployeeAccounts AS ea
             JOIN Employee AS e ON ea.EmployeeID = e.EmployeeID
             WHERE ea.Username = ?`,
            [username]
        );

        if (rows.length === 0 || rows[0].Password !== password) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const employee = rows[0];

        if (employee.AccountStatus !== 'Active') {
            return res.status(403).json({
                message: "This employee account is inactive"
            });
        }

        return res.status(200).json({
            message: "Employee logged in successfully",
            employee: {
                EmployeeID: employee.EmployeeID,
                Username: employee.Username,
                FirstName: employee.FirstName,
                LastName: employee.LastName,
                EmployeeRole: employee.EmployeeRole
            }
        });

    } catch (error) {
        console.error("Employee login failed:", error.message);

        return res.status(500).json({
            message: "Something went wrong with employee login"
        });
    }
});

export default router;
