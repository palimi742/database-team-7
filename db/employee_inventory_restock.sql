-- Calculate stock status using fixed quantity levels.
CREATE OR REPLACE VIEW employee_inventory_stock_report AS
SELECT
    InventoryID,
    SKU,
    InventoryName,
    CategoryID,
    StockQuantity,
    CASE
        WHEN StockQuantity = 0 THEN 'Out of stock'
        WHEN StockQuantity <= 20 THEN 'Low'
        WHEN StockQuantity >= 75 THEN 'High'
        ELSE 'Normal'
    END AS StockStatus
FROM Inventory;

-- Employee restock requests.
CREATE TABLE RestockRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    InventoryID INT NOT NULL,
    RequestedByEmployeeID INT NOT NULL,
    RequestedQuantity INT NOT NULL,
    StockAtRequest INT NOT NULL,
    EmployeeNote VARCHAR(500) NULL,

    Status ENUM(
        'Pending',
        'Approved',
        'Rejected',
        'Fulfilled'
    ) NOT NULL DEFAULT 'Pending',

    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReviewedByEmployeeID INT NULL,
    ReviewedAt TIMESTAMP NULL DEFAULT NULL,
    ManagerNote VARCHAR(500) NULL,
    FulfilledAt TIMESTAMP NULL DEFAULT NULL,

    -- Only one pending or approved request per product.
    -- Closed requests produce NULL, allowing future requests.
    OpenInventoryID INT GENERATED ALWAYS AS (
        CASE
            WHEN Status IN ('Pending', 'Approved')
                THEN InventoryID
            ELSE NULL
        END
    ) STORED,

    CONSTRAINT uq_restock_open_product
        UNIQUE (OpenInventoryID),

    CONSTRAINT fk_restock_inventory
        FOREIGN KEY (InventoryID)
        REFERENCES Inventory(InventoryID),

    CONSTRAINT fk_restock_requester
        FOREIGN KEY (RequestedByEmployeeID)
        REFERENCES Employee(EmployeeID),

    CONSTRAINT fk_restock_reviewer
        FOREIGN KEY (ReviewedByEmployeeID)
        REFERENCES Employee(EmployeeID),

    CONSTRAINT chk_restock_quantity
        CHECK (RequestedQuantity > 0),

    CONSTRAINT chk_restock_stock
        CHECK (StockAtRequest >= 0)
);

-- History of request status changes.
CREATE TABLE RestockRequestHistory (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    RequestID INT NOT NULL,
    OldStatus VARCHAR(20) NOT NULL,
    NewStatus VARCHAR(20) NOT NULL,
    ReviewedByEmployeeID INT NULL,
    ManagerNote VARCHAR(500) NULL,
    ChangedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_restock_history_request
        FOREIGN KEY (RequestID)
        REFERENCES RestockRequests(RequestID),

    CONSTRAINT fk_restock_history_reviewer
        FOREIGN KEY (ReviewedByEmployeeID)
        REFERENCES Employee(EmployeeID)
);

-- Automatically record each status change.
DELIMITER $$

CREATE TRIGGER restock_request_status_history
AFTER UPDATE ON RestockRequests
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO RestockRequestHistory (
            RequestID,
            OldStatus,
            NewStatus,
            ReviewedByEmployeeID,
            ManagerNote
        )
        VALUES (
            NEW.RequestID,
            OLD.Status,
            NEW.Status,
            NEW.ReviewedByEmployeeID,
            NEW.ManagerNote
        );
    END IF;
END$$

DELIMITER ;