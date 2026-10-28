USE grocery_store;

CREATE TABLE Cart (
    CartID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID  INT NOT NULL UNIQUE,
	CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES customer(CustomerID)
);

CREATE TABLE CartDetail (
	CartDetailID INT AUTO_INCREMENT PRIMARY KEY, 
    CartID INT NOT NULL,
    InventoryID INT NOT NULL,
    Quantity INT NOT NULL, 
    UNIQUE KEY unique_cart_inventory (CartID, InventoryID),
    FOREIGN KEY (CartID) REFERENCES Cart (CartID)
        ON DELETE CASCADE,
    FOREIGN KEY (InventoryID) REFERENCES inventory (InventoryId),
    CHECK (Quantity > 0)
);

