import { Router } from "express";
import pool from "../db.js";
const router = Router();

// !TODO Remaining work: verify a successful save, refresh dashboard data after assignment, and prevent concurrent double assignments.

router.get("/", async (req, res) => {
  try {
    // Get orders with their delivery type and employee name. LEFT JOIN keeps unassigned orders too.
    const result = await pool.query(`
        SELECT o.FulfillmentID,
        o.TransactionID,
        o.EmployeeID,
        d.DeliveryName,
        e.FirstName,
        e.LastName,
        o.Status
        FROM grocery_store.orderfulfillment AS o
        JOIN grocery_store.deliverytype AS d
            ON o.DeliveryID = d.DeliveryID
        LEFT JOIN grocery_store.employee AS e
            ON o.EmployeeID = e.EmployeeID
        ORDER BY FulfillmentID
        `);
    //Using a LEFT JOIN b/c it keeps all the orders even orders without an assigned employee
    // A RIGHT JOIN keeps employees and employee's without an order.
    // We want to manage orders to assign to employees without an order
    res.json(result[0]);
  } catch (err) {
    console.log("failed to load orders: ", err.message);
    res.status(500).json({
      message: "Unable to load orders for manager",
    });
  }
});


// Check the employee and order before saving an assignment.
// PATCH is also used to request an update.
router.patch("/:fulfillmentID/assign", async (req, res) => {
  // Read the fulfillment ID from the URL and the employee ID from the request body.
  const fulfillmentID = Number(req.params.fulfillmentID);
  const employeeID = Number(req.body.employeeID);

  // Reject IDs that are not positive whole numbers.
  if (!Number.isInteger(fulfillmentID) || fulfillmentID <= 0) {
    return res.status(400).json({
      message: "Invalid fulfillment ID",
    });
  }

  if (!Number.isInteger(employeeID) || employeeID <= 0) {
    return res.status(400).json({
      message: "Invalid employee ID",
    });
  }

  try {
    // Find regular employees who have no active assignment.
    const results = await pool.query(
      `
            SELECT employeeID
            FROM employee
            WHERE EmployeeRole != 'Manager'
                AND EmployeeID NOT IN (
                SELECT EmployeeID
                From orderfulfillment
                WHERE Status = 'Assigned'
                    AND employeeID IS NOT NULL
                )
            `,
    );
    
    // The first query result contains the rows. Check whether the selected employee is in them.
    const availableEmployees = results[0];
    const selectedEmployee = availableEmployees.find((employee) => {
      return employee.employeeID === employeeID;
    });

    // Find the requested fulfillment record so we can check its assignment status.
    const orderResults = await pool.query(`
        SELECT FulfillmentID, EmployeeID, Status
        FROM orderfulfillment
        `);
    const selectedOrder = orderResults[0].find((order) => {
      return order.FulfillmentID === fulfillmentID;
    });

    if (selectedEmployee === undefined) {
      return res.status(400).json({
        message: "employee is not avilable to be assigned",
      });
    }

    if(selectedOrder === undefined){
        return res.status(400).json({
            message: "Order not found"
        })
    }

    // Only orders with no employee and a Needs Assignment status can be assigned.
    if (
      selectedOrder.Status !== "Needs Assignment" ||
      selectedOrder.EmployeeID !== null
    ) {
      return res.status(400).json({
        message: "Order already completed or assigned",
      });
    }

    // Save the employee and status only if the order still needs assignment.
    const updateResult = await pool.query(`
        UPDATE orderfulfillment
        SET EmployeeID = ${employeeID},
        Status = 'Assigned'
        WHERE FulfillmentID = ${fulfillmentID}
        AND EmployeeID IS NULL
        AND Status = 'Needs Assignment'
        `)
        // No changed rows means the order no longer matched the update conditions.
        if(updateResult[0].affectedRows === 0){
            return res.status(400).json({
                message: "Order couldn't be assigned"
            })
        }
        
        res.json({
          message: "employee assigned a task",
          fulfillmentID: fulfillmentID,
          employeeID: employeeID,
        });

  } catch (err) {
    console.log("error", err.message);
    res.status(500).json({
      message: "unable to assign or grab employee",
    });
  }
});

export default router;
