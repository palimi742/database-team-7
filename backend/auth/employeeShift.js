// Use the Employee row as the common lock for shift-sensitive actions.
// Call inside an open transaction; clock-in/out and logout use the same lock.
export async function lockEmployee(db, employeeId) {
  await db.query("SELECT EmployeeID FROM Employee WHERE EmployeeID = ? FOR UPDATE", [employeeId]);
}

export async function hasOpenShift(db, employeeId) {
  const [[shift]] = await db.query(
    "SELECT TimeEntryID FROM EmployeeTimeEntries WHERE OpenEmployeeID = ? FOR UPDATE", [employeeId],
  );
  return Boolean(shift);
}

export async function requireOpenShift(db, employeeId) {
  await lockEmployee(db, employeeId);
  if (!await hasOpenShift(db, employeeId)) {
    const error = new Error("Please clock in before placing an order or requesting restock.");
    error.status = 409;
    error.code = "CLOCK_IN_REQUIRED";
    throw error;
  }
}