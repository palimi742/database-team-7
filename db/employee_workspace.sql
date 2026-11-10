-- Run after schema.sql against the database used by the FreshMart backend.
CREATE TABLE IF NOT EXISTS EmployeeTimeEntries (
    TimeEntryID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    ClockInUtc DATETIME(6) NOT NULL,
    ClockOutUtc DATETIME(6) NULL,
    HourlyRate DECIMAL(10,2) NOT NULL,
    OpenEmployeeID INT GENERATED ALWAYS AS (
        CASE WHEN ClockOutUtc IS NULL THEN EmployeeID END
    ) STORED,
    UNIQUE KEY uq_employee_open_time_entry (OpenEmployeeID),
    KEY idx_employee_time_history (EmployeeID, ClockInUtc),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS OrderPackedItems (
    FulfillmentID INT NOT NULL,
    TransactionItemID INT NOT NULL,
    PRIMARY KEY (FulfillmentID, TransactionItemID),
    FOREIGN KEY (FulfillmentID) REFERENCES OrderFulfillment(FulfillmentID),
    FOREIGN KEY (TransactionItemID) REFERENCES TransactionItems(TransactionItemID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS OrderIssues (
    IssueID INT AUTO_INCREMENT PRIMARY KEY,
    FulfillmentID INT NOT NULL,
    ReportedByEmployeeID INT NOT NULL,
    IssueType VARCHAR(32) NOT NULL,
    Details VARCHAR(500) NOT NULL,
    ReportedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ManagerResponse VARCHAR(500) NULL,
    RespondedByEmployeeID INT NULL,
    RespondedAt TIMESTAMP NULL,
    KEY idx_order_issue_reporter (ReportedByEmployeeID, FulfillmentID),
    FOREIGN KEY (FulfillmentID) REFERENCES OrderFulfillment(FulfillmentID),
    FOREIGN KEY (ReportedByEmployeeID) REFERENCES Employee(EmployeeID),
    FOREIGN KEY (RespondedByEmployeeID) REFERENCES Employee(EmployeeID)
) ENGINE=InnoDB;

-- Associate each staff-created sale with its creator and retry token.
CREATE TABLE IF NOT EXISTS EmployeePlacedOrders (
    TransactionID INT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    RequestKey CHAR(36) NOT NULL,
    UNIQUE KEY uq_employee_order_request (EmployeeID, RequestKey),
    FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID),
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW employee_inventory_stock_report AS
SELECT InventoryID, SKU, InventoryName, CategoryID, StockQuantity,
       CASE
           WHEN StockQuantity = 0 THEN 'Out of stock'
           WHEN StockQuantity < ReorderThreshold THEN 'Low'
           WHEN StockQuantity >= 75 THEN 'High'
           ELSE 'Normal'
       END AS StockStatus,
       ReorderThreshold
FROM Inventory
WHERE IsActive = TRUE;