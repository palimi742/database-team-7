DROP DATABASE IF EXISTS grocery_store;
CREATE DATABASE grocery_store;
USE grocery_store;
/* Customer Table */
CREATE TABLE Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(50) NOT NULL,
    CustomerAddress VARCHAR(150) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Customer Employee */
CREATE TABLE Employee (
    EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    EmployeeRole VARCHAR(50) NOT NULL,
    EmployeePay DECIMAL(10,2) NOT NULL,
    PhoneNumber VARCHAR(50) NOT NULL,
    EmailAddress VARCHAR(150) NOT NULL,
    EmployeeHireDate DATE NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
/* Customer Category */
CREATE TABLE Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
/* Customer DeliveryType */
CREATE TABLE DeliveryType (
    DeliveryID INT AUTO_INCREMENT PRIMARY KEY,
    DeliveryName VARCHAR(50) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
/* Customer Recipes */
CREATE TABLE Recipes (
    RecipeID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeName VARCHAR(150) NOT NULL,
    RecipeDescription VARCHAR(300),
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
/* Customer Inventory */
CREATE TABLE Inventory (
    InventoryID INT AUTO_INCREMENT PRIMARY KEY,
    SKU VARCHAR(50) NOT NULL,
    InventoryName VARCHAR(50) NOT NULL,
    CategoryID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    StockQuantity INT NOT NULL,
    ReorderThreshold INT NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
	REFERENCES Category(CategoryID)
);
/* Customer LoyaltyProgram */
CREATE TABLE LoyaltyProgram (
    LoyaltyProgramID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    CurrentPoints INT NOT NULL,
    DateJoined TIMESTAMP NOT NULL,
    TotalPointsEarned INT NOT NULL,
    TotalPointsRedeemed INT NOT NULL,
    LastActivityDate TIMESTAMP NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID)
);

/* Customer WorkSchedule */
CREATE TABLE WorkSchedule (
    ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Weekday VARCHAR(10) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID)
);
/* Customer SeasonalSales */
CREATE TABLE SeasonalSales (
    SeasonalSalesID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryID INT NOT NULL,
    SalesStart TIMESTAMP NOT NULL,
    SalesEnd TIMESTAMP NOT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
        REFERENCES Category(CategoryID)
);
/* Customer Coupons */
CREATE TABLE Coupons (
    CouponID INT AUTO_INCREMENT PRIMARY KEY,
    CouponName VARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    TimeStart TIMESTAMP NOT NULL,
    TimeEnd TIMESTAMP NOT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
        REFERENCES Category(CategoryID)
);
/* Customer Transactions */
CREATE TABLE Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    TransactionMethod VARCHAR(100) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    TransactionDate DATE NOT NULL,
    PointsEarned INT NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID)
);
/* Customer RecipeItems */
CREATE TABLE RecipeItems (
    RecipeItemID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeID INT NOT NULL,
    InventoryID INT NOT NULL,
    QuantityNeeded INT NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (RecipeID)
        REFERENCES Recipes(RecipeID),

    FOREIGN KEY (InventoryID)
        REFERENCES Inventory(InventoryID)
);
/* Customer TransactionsItems */
CREATE TABLE TransactionItems (
    TransactionItemID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionID INT NOT NULL,
    InventoryID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (TransactionID)
        REFERENCES Transactions(TransactionID),

    FOREIGN KEY (InventoryID)
        REFERENCES Inventory(InventoryID)
);
/* Customer UsedCoupons*/
CREATE TABLE UsedCoupons (
    CustomerCouponID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    CouponID INT NOT NULL,
    ClippedAt TIMESTAMP NOT NULL,
    Used BOOLEAN NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    FOREIGN KEY (CouponID)
        REFERENCES Coupons(CouponID)
);
/* Customer Reviews */
CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    InventoryID INT NOT NULL,
    Rating INT NOT NULL,
    ReviewText VARCHAR(1000),
    ReviewDate TIMESTAMP NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    FOREIGN KEY (InventoryID)
        REFERENCES Inventory(InventoryID)
);
/* Customer ProductReturns */
CREATE TABLE ProductReturns (
    ReturnID INT AUTO_INCREMENT PRIMARY KEY,
    QuantityReturned INT NOT NULL,
    RefundTotal DECIMAL(10,2) NOT NULL,
    ReturnDate TIMESTAMP NOT NULL,
    Disposable BOOLEAN NOT NULL,
    TransactionItemID INT NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (TransactionItemID)
        REFERENCES TransactionItems(TransactionItemID)
);

/* Customer logins */
CREATE TABLE CustomerAccounts (
    CustomerAccountID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL UNIQUE,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID)
);

/* Employee logins */
CREATE TABLE EmployeeAccounts (
    EmployeeAccountID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL UNIQUE,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID)
);

/* Customer OrderFulfillment */
CREATE TABLE OrderFulfillment (
    FulfillmentID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionID INT NOT NULL,
    EmployeeID INT NOT NULL,
    DeliveryID INT NOT NULL,
    FulfillmentTime TIMESTAMP NULL,
    ReadyStatus BOOLEAN,
    DeliveryAddress VARCHAR(150),
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (TransactionID)
        REFERENCES Transactions(TransactionID),

    FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID),

    FOREIGN KEY (DeliveryID)
        REFERENCES DeliveryType(DeliveryID)
);

ALTER TABLE Reviews          ADD CONSTRAINT chk_rating CHECK (Rating BETWEEN 1 AND 5);
ALTER TABLE Inventory        ADD CONSTRAINT chk_inventory CHECK (Price >= 0 AND StockQuantity >= 0);
ALTER TABLE TransactionItems ADD CONSTRAINT chk_item_qty CHECK (Quantity > 0);
ALTER TABLE ProductReturns   ADD CONSTRAINT chk_return_qty CHECK (QuantityReturned > 0);
ALTER TABLE Coupons          ADD CONSTRAINT chk_coupon_dates CHECK (TimeEnd > TimeStart);
ALTER TABLE SeasonalSales    ADD CONSTRAINT chk_sale_dates CHECK (SalesEnd > SalesStart);

ALTER TABLE LoyaltyProgram ADD CONSTRAINT uq_loyalty_customer UNIQUE (CustomerID);
ALTER TABLE Inventory      ADD CONSTRAINT uq_inventory_sku UNIQUE (SKU);
ALTER TABLE Employee       ADD CONSTRAINT uq_employee_email UNIQUE (EmailAddress);
