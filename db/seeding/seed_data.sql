USE grocery_store;

/* Category */
INSERT INTO Category
  (CategoryID, CategoryName, TableUpdateTime)
VALUES
  (1, 'Produce', NOW()),
  (2, 'Dairy', NOW()),
  (3, 'Bakery', NOW()),
  (4, 'Meat & Seafood', NOW()),
  (5, 'Beverages', NOW()),
  (6, 'Snacks', NOW()),
  (7, 'Pantry', NOW());

/* DeliveryType */
INSERT INTO DeliveryType
  (DeliveryID, DeliveryName, TableUpdateTime)
VALUES
  (1, 'Home Delivery', NOW()),
  (2, 'Curbside Pickup', NOW());

/* Employee */
INSERT INTO Employee
  (EmployeeID, FirstName, LastName, EmployeeRole, EmployeePay, PhoneNumber, EmailAddress, EmployeeHireDate, TableUpdateTime)
VALUES
  (1, 'Maria', 'Gonzalez', 'Manager', 28.5, '713-555-0101', 'maria.gonzalez@freshmart.com', '2022-03-14', NOW()),
  (2, 'James', 'Carter', 'Delivery', 18.0, '713-555-0102', 'james.carter@freshmart.com', '2023-06-01', NOW()),
  (3, 'Aisha', 'Khan', 'Delivery', 17.5, '713-555-0103', 'aisha.khan@freshmart.com', '2024-01-22', NOW()),
  (4, 'Luis', 'Ramirez', 'Delivery', 17.0, '713-555-0104', 'luis.ramirez@freshmart.com', '2025-05-09', NOW());

/* Customer */
INSERT INTO Customer
  (CustomerID, FirstName, LastName, PhoneNumber, CustomerAddress, TableUpdateTime)
VALUES
  (1, 'Olivia', 'Martinez', '832-555-0201', '1204 Elm Street, Houston, TX 77002', NOW()),
  (2, 'Ethan', 'Johnson', '832-555-0202', '88 Westheimer Road, Houston, TX 77006', NOW()),
  (3, 'Sophia', 'Nguyen', '832-555-0203', '452 Main Street, Houston, TX 77004', NOW()),
  (4, 'Noah', 'Patel', '832-555-0204', '9010 Bellaire Blvd, Houston, TX 77036', NOW()),
  (5, 'Emma', 'Brooks', '832-555-0205', '310 Kirby Drive, Houston, TX 77005', NOW()),
  (6, 'Liam', 'Hernandez', '832-555-0206', '77 Montrose Blvd, Houston, TX 77006', NOW());

/* CustomerAccounts */
INSERT INTO CustomerAccounts
  (CustomerAccountID, CustomerID, Username, Password, AccountStatus, CreatedDate, TableUpdateTime)
VALUES
  (1, 1, 'olivia', 'olivia123', 'Active', NOW(), NOW()),
  (2, 2, 'ethan', 'ethan456', 'Active', NOW(), NOW()),
  (3, 3, 'sophia', 'sophia789', 'Active', NOW(), NOW()),
  (4, 4, 'noah', 'noah321', 'Active', NOW(), NOW()),
  (5, 5, 'emma', 'emma654', 'Active', NOW(), NOW()),
  (6, 6, 'liam', 'liam987', 'Inactive', NOW(), NOW());

/* EmployeeAccounts */
INSERT INTO EmployeeAccounts
  (EmployeeAccountID, EmployeeID, Username, Password, AccountStatus, CreatedDate, TableUpdateTime)
VALUES
  (1, 1, 'manager1', 'manager123', 'Active', NOW(), NOW()),
  (2, 2, 'delivery1', 'delivery456', 'Active', NOW(), NOW()),
  (3, 3, 'delivery2', 'delivery789', 'Active', NOW(), NOW()),
  (4, 4, 'delivery3', 'delivery321', 'Active', NOW(), NOW());

/* LoyaltyProgram */
INSERT INTO LoyaltyProgram
  (LoyaltyProgramID, CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate, TableUpdateTime)
VALUES
  (1, 1, 28, '2026-06-20 10:00:00', 78, 50, '2026-10-04 12:00:00', NOW()),
  (2, 2, 60, '2026-06-28 10:00:00', 60, 0, '2026-10-14 12:00:00', NOW()),
  (3, 3, 41, '2026-07-01 10:00:00', 66, 25, '2026-10-10 12:00:00', NOW()),
  (4, 4, 42, '2026-07-30 10:00:00', 42, 0, '2026-09-20 12:00:00', NOW()),
  (5, 5, 33, '2026-08-10 10:00:00', 53, 20, '2026-09-28 12:00:00', NOW()),
  (6, 6, 40, '2026-09-01 10:00:00', 40, 0, '2026-10-15 12:00:00', NOW());

/* Inventory (stock shown is the CURRENT stock, after the sales below) */
INSERT INTO Inventory
  (InventoryID, SKU, InventoryName, CategoryID, Price, StockQuantity, ReorderThreshold, TableUpdateTime)
VALUES
  (1, 'PRD-001', 'Organic Bananas (1 lb)', 1, 0.69, 120, 30, NOW()),
  (2, 'PRD-002', 'Gala Apples (3 lb bag)', 1, 4.99, 80, 20, NOW()),
  (3, 'PRD-003', 'Baby Spinach (5 oz)', 1, 3.49, 8, 15, NOW()),
  (4, 'PRD-004', 'Roma Tomatoes (1 lb)', 1, 1.99, 60, 20, NOW()),
  (5, 'DAI-001', 'Whole Milk (1 gal)', 2, 3.89, 45, 20, NOW()),
  (6, 'DAI-002', 'Large Eggs (dozen)', 2, 3.29, 12, 25, NOW()),
  (7, 'DAI-003', 'Cheddar Cheese Block (8 oz)', 2, 2.99, 70, 15, NOW()),
  (8, 'BAK-001', 'Sourdough Loaf', 3, 4.5, 25, 10, NOW()),
  (9, 'BAK-002', 'Blueberry Muffins (4 ct)', 3, 5.25, 9, 10, NOW()),
  (10, 'MET-001', 'Chicken Breast (1 lb)', 4, 5.99, 40, 15, NOW()),
  (11, 'MET-002', 'Ground Beef 80/20 (1 lb)', 4, 6.49, 35, 15, NOW()),
  (12, 'MET-003', 'Atlantic Salmon Fillet (1 lb)', 4, 11.99, 18, 10, NOW()),
  (13, 'BEV-001', 'Orange Juice (52 oz)', 5, 4.29, 50, 20, NOW()),
  (14, 'BEV-002', 'Sparkling Water (12 pack)', 5, 5.99, 5, 15, NOW()),
  (15, 'BEV-003', 'Cold Brew Coffee (32 oz)', 5, 6.49, 30, 10, NOW()),
  (16, 'SNK-001', 'Tortilla Chips (13 oz)', 6, 3.99, 90, 25, NOW()),
  (17, 'SNK-002', 'Mixed Nuts (10 oz)', 6, 7.49, 55, 20, NOW()),
  (18, 'PAN-001', 'Spaghetti Pasta (16 oz)', 7, 1.79, 100, 30, NOW()),
  (19, 'PAN-002', 'Marinara Sauce (24 oz)', 7, 3.29, 85, 25, NOW()),
  (20, 'PAN-003', 'Long Grain Rice (5 lb)', 7, 5.49, 60, 20, NOW());

/* Coupons */
INSERT INTO Coupons
  (CouponID, CouponName, CategoryID, TimeStart, TimeEnd, DiscountAmount, TableUpdateTime)
VALUES
  (1, 'Fresh Produce $1 Off', 1, '2026-10-01 00:00:00', '2026-10-31 23:59:59', 1.0, NOW()),
  (2, 'Dairy Savings $0.75 Off', 2, '2026-10-10 00:00:00', '2026-11-10 23:59:59', 0.75, NOW()),
  (3, 'Bakery Treat $1.50 Off', 3, '2026-09-01 00:00:00', '2026-09-30 23:59:59', 1.5, NOW()),
  (4, 'Holiday Meat Deal $2 Off', 4, '2026-11-15 00:00:00', '2026-12-24 23:59:59', 2.0, NOW()),
  (5, 'Pantry Stock-Up $1 Off', 7, '2026-10-05 00:00:00', '2026-10-25 23:59:59', 1.0, NOW()),
  (6, 'Beverage Refresh $0.50 Off', 5, '2026-10-15 00:00:00', '2026-10-22 23:59:59', 0.5, NOW());

/* SeasonalSales (DiscountAmount is dollars off) */
INSERT INTO SeasonalSales
  (SeasonalSalesID, CategoryID, SalesStart, SalesEnd, DiscountAmount, TableUpdateTime)
VALUES
  (1, 5, '2026-08-01 00:00:00', '2026-08-31 23:59:59', 0.5, NOW()),
  (2, 1, '2026-09-20 00:00:00', '2026-10-20 23:59:59', 0.25, NOW()),
  (3, 6, '2026-10-25 00:00:00', '2026-11-05 23:59:59', 0.5, NOW()),
  (4, 7, '2026-11-15 00:00:00', '2026-11-28 23:59:59', 0.75, NOW()),
  (5, 3, '2026-11-20 00:00:00', '2026-11-30 23:59:59', 1.0, NOW());

/* WorkSchedule */
INSERT INTO WorkSchedule
  (ScheduleID, EmployeeID, Weekday, StartTime, EndTime, TableUpdateTime)
VALUES
  (1, 1, 'Monday', '08:00:00', '16:00:00', NOW()),
  (2, 1, 'Tuesday', '08:00:00', '16:00:00', NOW()),
  (3, 1, 'Wednesday', '08:00:00', '16:00:00', NOW()),
  (4, 1, 'Thursday', '08:00:00', '16:00:00', NOW()),
  (5, 1, 'Friday', '08:00:00', '16:00:00', NOW()),
  (6, 2, 'Monday', '10:00:00', '18:00:00', NOW()),
  (7, 2, 'Wednesday', '10:00:00', '18:00:00', NOW()),
  (8, 2, 'Friday', '10:00:00', '18:00:00', NOW()),
  (9, 2, 'Saturday', '09:00:00', '15:00:00', NOW()),
  (10, 3, 'Tuesday', '12:00:00', '20:00:00', NOW()),
  (11, 3, 'Thursday', '12:00:00', '20:00:00', NOW()),
  (12, 3, 'Saturday', '09:00:00', '17:00:00', NOW()),
  (13, 3, 'Sunday', '10:00:00', '16:00:00', NOW()),
  (14, 4, 'Monday', '09:00:00', '17:00:00', NOW()),
  (15, 4, 'Tuesday', '09:00:00', '17:00:00', NOW()),
  (16, 4, 'Thursday', '09:00:00', '17:00:00', NOW()),
  (17, 4, 'Sunday', '10:00:00', '14:00:00', NOW());

/* Recipes */
INSERT INTO Recipes
  (RecipeID, RecipeName, RecipeDescription, TableUpdateTime)
VALUES
  (1, 'Spaghetti with Meat Sauce', 'Classic weeknight spaghetti with ground beef and marinara.', NOW()),
  (2, 'Chicken and Rice Bowl', 'Seared chicken over rice with tomatoes and fresh spinach.', NOW()),
  (3, 'Sunday Breakfast Scramble', 'Eggs scrambled with cheddar and spinach, served with sourdough.', NOW()),
  (4, 'Loaded Nacho Plate', 'Tortilla chips topped with melted cheddar and diced tomatoes.', NOW());

/* RecipeItems */
INSERT INTO RecipeItems
  (RecipeItemID, RecipeID, InventoryID, QuantityNeeded, TableUpdateTime)
VALUES
  (1, 1, 18, 1, NOW()),
  (2, 1, 19, 1, NOW()),
  (3, 1, 11, 1, NOW()),
  (4, 2, 10, 1, NOW()),
  (5, 2, 20, 1, NOW()),
  (6, 2, 4, 2, NOW()),
  (7, 2, 3, 1, NOW()),
  (8, 3, 6, 1, NOW()),
  (9, 3, 7, 1, NOW()),
  (10, 3, 3, 1, NOW()),
  (11, 3, 8, 1, NOW()),
  (12, 4, 16, 1, NOW()),
  (13, 4, 7, 1, NOW()),
  (14, 4, 4, 1, NOW());

/* Transactions (TotalPrice = sum of its items; PointsEarned = FLOOR(total)) */
INSERT INTO Transactions
  (TransactionID, CustomerID, TransactionMethod, TotalPrice, TransactionDate, PointsEarned, TableUpdateTime)
VALUES
  (1, 1, 'Credit Card', 22.44, '2026-07-08', 22, NOW()),
  (2, 2, 'Debit Card', 19.76, '2026-07-15', 19, NOW()),
  (3, 3, 'Credit Card', 26.13, '2026-07-22', 26, NOW()),
  (4, 1, 'Apple Pay', 36.45, '2026-08-03', 36, NOW()),
  (5, 4, 'PayPal', 19.61, '2026-08-11', 19, NOW()),
  (6, 5, 'Credit Card', 22.46, '2026-08-19', 22, NOW()),
  (7, 2, 'Debit Card', 27.03, '2026-08-27', 27, NOW()),
  (8, 3, 'Credit Card', 18.72, '2026-09-05', 18, NOW()),
  (9, 6, 'Debit Card', 23.79, '2026-09-12', 23, NOW()),
  (10, 4, 'Apple Pay', 23.97, '2026-09-20', 23, NOW()),
  (11, 5, 'Credit Card', 31.85, '2026-09-28', 31, NOW()),
  (12, 1, 'Credit Card', 20.24, '2026-10-04', 20, NOW()),
  (13, 3, 'PayPal', 22.63, '2026-10-10', 22, NOW()),
  (14, 2, 'Debit Card', 14.26, '2026-10-14', 14, NOW()),
  (15, 6, 'Credit Card', 17.87, '2026-10-15', 17, NOW());

/* TransactionItems */
INSERT INTO TransactionItems
  (TransactionItemID, TransactionID, InventoryID, Quantity, UnitPrice, TableUpdateTime)
VALUES
  (1, 1, 1, 3, 0.69, NOW()),
  (2, 1, 5, 1, 3.89, NOW()),
  (3, 1, 8, 1, 4.5, NOW()),
  (4, 1, 10, 2, 5.99, NOW()),
  (5, 2, 16, 2, 3.99, NOW()),
  (6, 2, 17, 1, 7.49, NOW()),
  (7, 2, 13, 1, 4.29, NOW()),
  (8, 3, 18, 2, 1.79, NOW()),
  (9, 3, 19, 2, 3.29, NOW()),
  (10, 3, 11, 2, 6.49, NOW()),
  (11, 3, 7, 1, 2.99, NOW()),
  (12, 4, 12, 2, 11.99, NOW()),
  (13, 4, 20, 1, 5.49, NOW()),
  (14, 4, 3, 2, 3.49, NOW()),
  (15, 5, 6, 2, 3.29, NOW()),
  (16, 5, 5, 2, 3.89, NOW()),
  (17, 5, 9, 1, 5.25, NOW()),
  (18, 6, 14, 2, 5.99, NOW()),
  (19, 6, 15, 1, 6.49, NOW()),
  (20, 6, 16, 1, 3.99, NOW()),
  (21, 7, 10, 3, 5.99, NOW()),
  (22, 7, 4, 2, 1.99, NOW()),
  (23, 7, 18, 1, 1.79, NOW()),
  (24, 7, 19, 1, 3.29, NOW()),
  (25, 8, 2, 2, 4.99, NOW()),
  (26, 8, 1, 4, 0.69, NOW()),
  (27, 8, 7, 2, 2.99, NOW()),
  (28, 9, 8, 2, 4.5, NOW()),
  (29, 9, 9, 2, 5.25, NOW()),
  (30, 9, 13, 1, 4.29, NOW()),
  (31, 10, 11, 1, 6.49, NOW()),
  (32, 10, 12, 1, 11.99, NOW()),
  (33, 10, 20, 1, 5.49, NOW()),
  (34, 11, 17, 2, 7.49, NOW()),
  (35, 11, 15, 2, 6.49, NOW()),
  (36, 11, 5, 1, 3.89, NOW()),
  (37, 12, 2, 1, 4.99, NOW()),
  (38, 12, 4, 3, 1.99, NOW()),
  (39, 12, 6, 1, 3.29, NOW()),
  (40, 12, 10, 1, 5.99, NOW()),
  (41, 13, 14, 1, 5.99, NOW()),
  (42, 13, 16, 2, 3.99, NOW()),
  (43, 13, 18, 3, 1.79, NOW()),
  (44, 13, 19, 1, 3.29, NOW()),
  (45, 14, 5, 2, 3.89, NOW()),
  (46, 14, 7, 1, 2.99, NOW()),
  (47, 14, 3, 1, 3.49, NOW()),
  (48, 15, 12, 1, 11.99, NOW()),
  (49, 15, 1, 2, 0.69, NOW()),
  (50, 15, 8, 1, 4.5, NOW());

/* Reviews */
INSERT INTO Reviews
  (ReviewID, CustomerID, InventoryID, Rating, ReviewText, ReviewDate, TableUpdateTime)
VALUES
  (1, 1, 5, 5, 'Fresh and creamy, stays good for a full week.', '2026-07-12 09:15:00', NOW()),
  (2, 1, 10, 4, 'Good quality chicken, nicely trimmed.', '2026-07-12 09:20:00', NOW()),
  (3, 2, 16, 5, 'Crunchy and not too salty. Perfect for parties.', '2026-07-20 18:40:00', NOW()),
  (4, 3, 11, 3, 'Okay for the price but a bit fatty.', '2026-07-27 13:05:00', NOW()),
  (5, 3, 19, 4, 'Tastes homemade, great with pasta.', '2026-07-27 13:10:00', NOW()),
  (6, 1, 12, 5, 'Best salmon we have bought here.', '2026-08-07 19:30:00', NOW()),
  (7, 4, 6, 2, 'Two eggs were cracked when delivered.', '2026-08-14 08:55:00', NOW()),
  (8, 4, 9, 4, 'Soft and fresh, kids loved them.', '2026-08-14 09:00:00', NOW()),
  (9, 5, 14, 2, 'Arrived flat, the cans were dented.', '2026-08-22 16:45:00', NOW()),
  (10, 3, 2, 5, 'Crisp and sweet apples.', '2026-09-09 11:00:00', NOW()),
  (11, 6, 8, 5, 'Great crust and tangy flavor.', '2026-09-16 10:25:00', NOW()),
  (12, 5, 17, 4, 'Fresh nuts, good mix.', '2026-10-01 20:10:00', NOW()),
  (13, 1, 2, 4, 'Solid apples, a little small this time.', '2026-10-08 17:35:00', NOW()),
  (14, 3, 2, 5, 'Bought again and they were even better.', '2026-10-12 09:50:00', NOW()),
  (15, 2, 5, 5, 'Always fresh.', '2026-10-16 08:00:00', NOW());

/* ProductReturns */
INSERT INTO ProductReturns
  (ReturnID, QuantityReturned, RefundTotal, ReturnDate, Disposable, TransactionItemID, TableUpdateTime)
VALUES
  (1, 1, 3.89, '2026-08-13 14:00:00', 1, 16, NOW()),
  (2, 1, 4.99, '2026-09-08 11:30:00', 0, 25, NOW()),
  (3, 1, 7.49, '2026-09-30 16:20:00', 0, 34, NOW());

/* UsedCoupons */
INSERT INTO UsedCoupons
  (CustomerCouponID, CustomerID, CouponID, ClippedAt, Used, TableUpdateTime)
VALUES
  (1, 1, 1, '2026-10-02 08:00:00', 1, NOW()),
  (2, 2, 1, '2026-10-03 09:30:00', 0, NOW()),
  (3, 3, 2, '2026-10-11 12:15:00', 1, NOW()),
  (4, 4, 2, '2026-10-12 17:00:00', 0, NOW()),
  (5, 5, 3, '2026-09-05 10:00:00', 1, NOW()),
  (6, 1, 5, '2026-10-06 19:20:00', 0, NOW()),
  (7, 6, 6, '2026-10-15 07:45:00', 0, NOW()),
  (8, 3, 3, '2026-09-10 14:10:00', 1, NOW()),
  (9, 2, 5, '2026-10-07 11:05:00', 1, NOW()),
  (10, 4, 3, '2026-09-15 16:40:00', 0, NOW());

/* OrderFulfillment */
INSERT INTO OrderFulfillment
  (FulfillmentID, TransactionID, EmployeeID, DeliveryID, FulfillmentTime, ReadyStatus, DeliveryAddress, TableUpdateTime)
VALUES
  (1, 1, 2, 1, '2026-07-08 17:30:00', 1, '1204 Elm Street, Houston, TX 77002', NOW()),
  (2, 2, 3, 2, '2026-07-15 17:30:00', 1, NULL, NOW()),
  (3, 3, 4, 1, '2026-07-22 17:30:00', 1, '452 Main Street, Houston, TX 77004', NOW()),
  (4, 4, 2, 2, '2026-08-03 17:30:00', 1, NULL, NOW()),
  (5, 5, 3, 1, '2026-08-11 17:30:00', 1, '9010 Bellaire Blvd, Houston, TX 77036', NOW()),
  (6, 6, 4, 2, '2026-08-19 17:30:00', 1, NULL, NOW()),
  (7, 7, 2, 1, '2026-08-27 17:30:00', 1, '88 Westheimer Road, Houston, TX 77006', NOW()),
  (8, 8, 3, 2, '2026-09-05 17:30:00', 1, NULL, NOW()),
  (9, 9, 4, 1, '2026-09-12 17:30:00', 1, '77 Montrose Blvd, Houston, TX 77006', NOW()),
  (10, 10, 2, 2, '2026-09-20 17:30:00', 1, NULL, NOW()),
  (11, 11, 3, 1, '2026-09-28 17:30:00', 1, '310 Kirby Drive, Houston, TX 77005', NOW()),
  (12, 12, 4, 2, '2026-10-04 17:30:00', 1, NULL, NOW()),
  (13, 13, 2, 1, '2026-10-10 17:30:00', 1, '452 Main Street, Houston, TX 77004', NOW()),
  (14, 14, 3, 2, NULL, 1, NULL, NOW()),
  (15, 15, 4, 1, NULL, 0, '77 Montrose Blvd, Houston, TX 77006', NOW());