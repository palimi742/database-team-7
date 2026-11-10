import { Router } from "express";
import pool from "../../db.js";

const router = Router();

// All /api/manager routes already pass through requireManager in server.js.
router.get("/", async (_req, res, next) => {
  try {
    const [issues] = await pool.query(
      `SELECT i.IssueID, i.IssueType, i.Details, i.ReportedAt, i.ManagerResponse,
              o.TransactionID, e.FirstName, e.LastName
       FROM OrderIssues i
       JOIN OrderFulfillment o ON o.FulfillmentID = i.FulfillmentID
       JOIN Employee e ON e.EmployeeID = i.ReportedByEmployeeID
       ORDER BY i.RespondedAt IS NULL DESC, i.IssueID DESC`,
    );
    res.json({ issues });
  } catch (error) {
    next(error);
  }
});

router.patch("/:issueId", async (req, res, next) => {
  const issueId = Number(req.params.issueId);
  const response = typeof req.body?.response === "string" ? req.body.response.trim() : "";
  if (!Number.isSafeInteger(issueId) || issueId < 1 || !response || response.length > 500) {
    return res.status(400).json({ message: "Enter a response between 1 and 500 characters." });
  }
  try {
    const [result] = await pool.query(
      `UPDATE OrderIssues
       SET ManagerResponse = ?, RespondedByEmployeeID = ?, RespondedAt = CURRENT_TIMESTAMP
       WHERE IssueID = ? AND RespondedAt IS NULL`,
      [response, req.employee.EmployeeID, issueId],
    );
    if (!result.affectedRows) {
      return res.status(409).json({ message: "This issue was already answered or is unavailable." });
    }
    res.json({ message: "Response sent to the employee." });
  } catch (error) {
    next(error);
  }
});

export default router;