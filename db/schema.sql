DROP DATABASE IF EXISTS grocery_store;
CREATE DATABASE grocery_store;
USE grocery_store;
/* Customer Table */
CREATE TABLE Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    EmailAddress VARCHAR (150) NOT NULL UNIQUE,
    CustomerAddress VARCHAR(150) NULL,
    Username VARCHAR(50) NOT NULL UNIQUE, 
    Password VARCHAR(255) NOT NULL,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active',

    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP
);
/*Users will be allowed to change their First Name, Last Name, Username,
address, email, and password
*/

/* Employee Table*/
CREATE TABLE Employee (
    EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    EmployeeRole VARCHAR(50) NOT NULL,
    EmailAddress VARCHAR(150) NOT NULL UNIQUE,
    EmployeeHireDate DATE NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active',

    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP
);
/*Employees will be allowed to change their first name, last name,
email, username, and password*/

/* Categories */
CREATE TABLE Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL UNIQUE,

    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Have preset categories. The employee will select from and add products

/* Customer DeliveryType */
CREATE TABLE DeliveryType (
    DeliveryID INT AUTO_INCREMENT PRIMARY KEY,
    DeliveryName VARCHAR(50) NOT NULL UNIQUE,
    CreatedDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Customer Recipes */
CREATE TABLE Recipes (
    RecipeID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeName VARCHAR(150) NOT NULL UNIQUE,
    RecipeDescription VARCHAR(300),

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
-- Update everytime the recipe is changed

/* Products */
CREATE TABLE Products (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    SKU VARCHAR(50) NOT NULL UNIQUE,
    ProductName VARCHAR(50) NOT NULL,
    CategoryID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    StockQuantity INT NOT NULL,
    ReorderThreshold INT NOT NULL,

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID) 
        REFERENCES Category(CategoryID),

    CONSTRAINT check_product_values CHECK(
        Price > 0
        AND StockQuantity >= 0
        AND ReorderThreshold >= 0
    )
);


/* Customer LoyaltyProgram */
CREATE TABLE LoyaltyProgram (
    LoyaltyProgramID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL UNIQUE,
    CurrentPoints INT NOT NULL DEFAULT 0,
    TotalPointsEarned INT NOT NULL DEFAULT 0,
    TotalPointsRedeemed INT NOT NULL DEFAULT 0,

    DateJoined TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    LastActivityDate TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    -- Constraints exist to check value before the database accepts them on an update
    -- No negative Points
    CONSTRAINT check_loyalty_points CHECK(
        CurrentPoints >= 0
        AND TotalPointsEarned >= 0
        AND TotalPointsRedeemed >= 0
    )
);

/* Employee WorkSchedule */
CREATE TABLE WorkSchedule (
    ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Weekday VARCHAR(10) NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,

    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID),
    
    CONSTRAINT check_weekday CHECK(
        Weekday IN (
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
            'Saturday', 'Sunday'
        )),
    
    CONSTRAINT check_shift_times CHECK (
        StartTime >= '00:00:00'
        AND StartTime < '24:00:00'
        AND EndTime >= '00:00:00'
        AND EndTime < '24:00:00'
    )
);

/* SeasonalSales */
CREATE TABLE SeasonalSales (
    SeasonalSalesID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryID INT NOT NULL,
    SalesStart TIMESTAMP NOT NULL,
    SalesEnd TIMESTAMP NOT NULL,
    DiscountPercent DECIMAL(5,2) NOT NULL,

    TableUpdateTime TIMESTAMP NOT NULL 
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
        REFERENCES Category(CategoryID),

    CONSTRAINT check_sale_dates CHECK(
        SalesEnd > SalesStart
    ),

-- No discount should exist when 0 and should not cover the whole price
    CONSTRAINT check_sale_discount CHECK(
        DiscountPercent > 0
        AND DiscountPercent <= 90
    )
);

/* Coupons. This table is for defining the coupon
Such as how much, expiration date, activation date, and on what */
CREATE TABLE Coupons (
    CouponID INT AUTO_INCREMENT PRIMARY KEY,
    CouponName VARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    TimeStart TIMESTAMP NOT NULL,
    TimeEnd TIMESTAMP NOT NULL,
    DiscountPercent DECIMAL(5,2) NOT NULL,

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (CategoryID)
        REFERENCES Category(CategoryID),

    CONSTRAINT check_coupon_dates CHECK(
        TimeEnd > TimeStart
    ),
    CONSTRAINT check_coupon_discount CHECK(
        DiscountPercent > 0
        AND DiscountPercent <= 90
    )
);

/* Customer Transactions 
This table stores the whole transaction*/
CREATE TABLE Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    TransactionMethod VARCHAR(100) NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    PointsEarned INT NOT NULL DEFAULT 0,
    TransactionDate TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    CONSTRAINT check_transaction_total CHECK(
        TotalPrice >= 0
    ),
    CONSTRAINT check_transaction_points CHECK(
        PointsEarned >= 0
    )
);
/* RecipeItems */
CREATE TABLE RecipeItems (
    RecipeItemID INT AUTO_INCREMENT PRIMARY KEY,
    RecipeID INT NOT NULL,
    ProductID INT NOT NULL,
    QuantityNeeded INT NOT NULL,
    TableUpdateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (RecipeID)
        REFERENCES Recipes(RecipeID),

    FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID),

    CONSTRAINT recipe_quantity CHECK(
        QuantityNeeded > 0
    ),

    -- No recipe can have the same ingredient twice
    CONSTRAINT unique_recipe_item UNIQUE(
        RecipeID, ProductID
    )
);
/* TransactionsItems stores each product in a transaction. To keep each item separate. */
CREATE TABLE TransactionItems (
    TransactionItemID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (TransactionID)
        REFERENCES Transactions(TransactionID),

    FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID),

    CONSTRAINT check_item_quantity CHECK(
        Quantity > 0
    ),

    CONSTRAINT check_item_price CHECK(
        UnitPrice > 0
    )
);

/* Customer Coupons. This table is for keeping track of which coupons
a customer has clipped to their account*/
CREATE TABLE CustomerCoupons (
    CustomerCouponID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    CouponID INT NOT NULL,
    ClippedAt TIMESTAMP NOT NULL,
    Used BOOLEAN NOT NULL DEFAULT FALSE,

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),
    

    FOREIGN KEY (CouponID)
        REFERENCES Coupons(CouponID),
    -- References the exact coupon

    CONSTRAINT unique_coupon UNIQUE(
        CustomerID, CouponID
    ),
    CONSTRAINT coupon_used CHECK(
        USED IN (FALSE, TRUE)
    )
);

/* Customer Reviews */
CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    ProductID INT NOT NULL,
    Rating INT NOT NULL,
    ReviewText VARCHAR(1000),
    ReviewDate TIMESTAMP NOT NULL,

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID),

    -- Can only leave between a 1 Star or 5 Star Review
    CONSTRAINT rating CHECK(
        Rating BETWEEN 1 AND 5
    )
);

/* Customer ProductReturns */
CREATE TABLE ProductReturns (
    ReturnID INT AUTO_INCREMENT PRIMARY KEY,
    QuantityReturned INT NOT NULL,
    TransactionItemID INT NOT NULL,
    Disposable BOOLEAN NULL,
    ReturnReason VARCHAR(300) NOT NULL,
    RefundTotal DECIMAL(10,2) NOT NULL,
    ApprovalStatus VARCHAR(20) NOT NULL DEFAULT 'Pending',
    ApprovedByEmployeeID INT NULL,

    ApprovedDate TIMESTAMP NULL,
    ReturnDate TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ApprovedByEmployeeID)
        REFERENCES Employee(EmployeeID),
    FOREIGN KEY (TransactionItemID)
        REFERENCES TransactionItems(TransactionItemID),

    CONSTRAINT check_return_quantity CHECK(
        QuantityReturned > 0
    ),
    CONSTRAINT check_refund_total CHECK(
        RefundTotal >= 0
    ),
    CONSTRAINT check_return_status CHECK(
        ApprovalStatus IN ('Pending', 'Approved', 'Rejected')
    ),
    CONSTRAINT check_disposable CHECK(
        Disposable IN (FALSE, TRUE)
    )
);

/* Customer OrderFulfillment. How the order was given to a customer */
CREATE TABLE OrderFulfillment (
    FulfillmentID INT AUTO_INCREMENT PRIMARY KEY,
    TransactionID INT NOT NULL UNIQUE,
    EmployeeID INT NOT NULL,
    DeliveryID INT NOT NULL,
    FulfillmentTime TIMESTAMP NULL,
    ReadyStatus BOOLEAN NOT NULL DEFAULT FALSE,
    DeliveryAddress VARCHAR(150),

    TableUpdateTime TIMESTAMP NOT NULL 
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (TransactionID)
        REFERENCES Transactions(TransactionID),

    FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID),

    FOREIGN KEY (DeliveryID)
        REFERENCES DeliveryType(DeliveryID),

    CONSTRAINT check_ready_status CHECK(
        ReadyStatus IN (FALSE, TRUE)
    )
);
