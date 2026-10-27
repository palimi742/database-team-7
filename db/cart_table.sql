USE grocery_store;


CREATE TABLE Cart (
    CartID INT AUTO_INCREMENT PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CartDetail (
	CartDetailID INT AUTO_INCREMENT PRIMARY KEY, 
    CartID INT NOT NULL,
    Quantity INT NOT NULL, 
    ProductID INT,
    UNIQUE KEY unique_cart_product (CartID, ProductID),
    FOREIGN KEY (CartID) REFERENCES Cart (CartID),
    FOREIGN KEY (ProductID) REFERENCES Inventory (InventoryId)
);

CREATE TABLE ReturnRequests (
    ReturnRequestID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionItemID INT NOT NULL,
    Quantity INT NOT NULL,
    Reason VARCHAR(50) NOT NULL,
    Details VARCHAR(500) NULL,
    ExpectedRefund DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Requested',
    ReturnID INT NULL,
    RequestedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TransactionItemID) REFERENCES TransactionItems (TransactionItemID),
    FOREIGN KEY (ReturnID) REFERENCES ProductReturns (ReturnID),
    CONSTRAINT chk_request_qty CHECK (Quantity > 0)
);

/*this is just for wether customer wants curbside or delivery*/

SELECT * FROM DeliveryType;
INSERT INTO DeliveryType (DeliveryName) VALUES ('Delivery'), ('Curbside');
