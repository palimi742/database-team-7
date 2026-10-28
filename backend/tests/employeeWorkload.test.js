import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEmployees } from '../routes/employeeWorkload.js';

test('summary counts employees once and includes hires on both date boundaries', () => {
  const employees = [
    { EmployeePay: '20.00', WeeklyHours: '40', EmployeeHireDate: '2026-10-01' },
    { EmployeePay: '30.00', WeeklyHours: '8.5', EmployeeHireDate: '2026-10-27' },
    { EmployeePay: '25.00', WeeklyHours: 0, EmployeeHireDate: '2026-09-30' },
    { EmployeePay: '25.00', WeeklyHours: 0, EmployeeHireDate: '2026-10-28' },
  ];
  const report = summarizeEmployees(employees, '2026-10-01', '2026-10-27');
  assert.equal(report.employeeCount, 4);
  assert.equal(report.averageSalary, 25);
  assert.equal(report.highestSalary, 30);
  assert.equal(report.weeklyHours, 48.5);
  assert.equal(report.recentHires.length, 2);
});
test('empty staff returns zero totals', () => {
  assert.deepEqual(summarizeEmployees([], '2026-10-01', '2026-10-27'), {
    employeeCount: 0, averageSalary: 0, highestSalary: 0, weeklyHours: 0, recentHires: [],
  });
});
