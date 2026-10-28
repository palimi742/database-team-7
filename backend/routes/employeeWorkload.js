import { Router } from "express";
import pool from "../db.js";

export function summarizeEmployees(employees, hiredSince, asOf) {
  let totalPay = 0;
  let highestSalary = 0;
  let weeklyHours = 0;
  const recentHires = [];

  for (const employee of employees) {
    const pay = Number(employee.EmployeePay);
    totalPay += pay;
    weeklyHours += Number(employee.WeeklyHours);

    if (pay > highestSalary) {
      highestSalary = pay;
    }
    if (
      employee.EmployeeHireDate >= hiredSince &&
      employee.EmployeeHireDate <= asOf
    ) {
      recentHires.push(employee);
    }
  }

  let averageSalary = 0;
  if (employees.length > 0) {
    averageSalary = totalPay / employees.length;
  }

  return {
    employeeCount: employees.length,
    averageSalary,
    highestSalary,
    weeklyHours,
    recentHires,
  };
}

const router = Router();
router.get("/", async (req, res) => {
  const { hiredSince, asOf } = req.query;
  if (!hiredSince || !asOf) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required" });
  }
  if (hiredSince > asOf) {
    return res.status(400).json({
      message: "Provide valid hire dates with the start on or before the end.",
    });
  }
  try {
    const results = await pool.query(
      `SELECT EmployeeID, FirstName, LastName, EmployeeRole, EmployeePay,
              EmployeeHireDate
       FROM Employee
       ORDER BY EmployeeHireDate DESC`,
    );
    const employees = results[0];

    const scheduleResults = await pool.query(
      `SELECT EmployeeID, StartTime, EndTime FROM WorkSchedule`,
    );
    const schedules = scheduleResults[0];

    for (const employee of employees) {
      const hireDate = new Date(employee.EmployeeHireDate);
      const year = hireDate.getFullYear();
      let month = String(hireDate.getMonth() + 1);
      let day = String(hireDate.getDate());

      if (month.length === 1) {
        month = "0" + month;
      }
      if (day.length === 1) {
        day = "0" + day;
      }
      employee.EmployeeHireDate = year + "-" + month + "-" + day;
      employee.WeeklyHours = 0;

      for (const schedule of schedules) {
        if (schedule.EmployeeID === employee.EmployeeID) {
          const start = schedule.StartTime.split(":");
          const end = schedule.EndTime.split(":");
          const startHours =
            Number(start[0]) + Number(start[1]) / 60 + Number(start[2]) / 3600;
          const endHours =
            Number(end[0]) + Number(end[1]) / 60 + Number(end[2]) / 3600;
          let hours = endHours - startHours;

          // A shift ending the next morning goes past midnight.
          if (hours < 0) {
            hours += 24;
          }
          employee.WeeklyHours += hours;
        }
      }
    }
    const summary = summarizeEmployees(employees, hiredSince, asOf);
    res.json({
      employees,
      employeeCount: summary.employeeCount,
      averageSalary: summary.averageSalary,
      highestSalary: summary.highestSalary,
      weeklyHours: summary.weeklyHours,
      recentHires: summary.recentHires,
      hiredSince,
      asOf,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Unable to load employee report" });
  }
});
export default router;
