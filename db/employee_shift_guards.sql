-- Run AFTER employee_workspace.sql and employee_inventory_restock.sql have been installed.
-- Use your existing database. This file does not drop tables, data, or the stock trigger.
-- Only these two employee guard triggers are replaced when rerun.

DELIMITER $$
DROP TRIGGER IF EXISTS employee_order_requires_shift$$
CREATE TRIGGER employee_order_requires_shift
BEFORE INSERT ON EmployeePlacedOrders
FOR EACH ROW
BEGIN
    DECLARE open_shift INT DEFAULT NULL;
    SELECT TimeEntryID INTO open_shift FROM EmployeeTimeEntries
      WHERE OpenEmployeeID = NEW.EmployeeID LIMIT 1 FOR UPDATE;
    IF open_shift IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please clock in before placing an order.';
    END IF;
END$$

DROP TRIGGER IF EXISTS employee_restock_requires_shift$$
CREATE TRIGGER employee_restock_requires_shift
BEFORE INSERT ON RestockRequests
FOR EACH ROW
BEGIN
    DECLARE open_shift INT DEFAULT NULL;
    SELECT TimeEntryID INTO open_shift FROM EmployeeTimeEntries
      WHERE OpenEmployeeID = NEW.RequestedByEmployeeID LIMIT 1 FOR UPDATE;
    IF open_shift IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Please clock in before requesting restock.';
    END IF;
END$$
DELIMITER ;