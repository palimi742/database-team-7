-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: team7-grocery-cosc3380.mysql.database.azure.com    Database: grocery_store
-- ------------------------------------------------------
-- Server version	8.4.9-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `CartID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CartID`),
  UNIQUE KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=575 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cartdetail`
--

DROP TABLE IF EXISTS `cartdetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartdetail` (
  `CartDetailID` int NOT NULL AUTO_INCREMENT,
  `CartID` int NOT NULL,
  `InventoryID` int NOT NULL,
  `Quantity` int NOT NULL,
  PRIMARY KEY (`CartDetailID`),
  UNIQUE KEY `unique_cart_inventory` (`CartID`,`InventoryID`),
  KEY `InventoryID` (`InventoryID`),
  CONSTRAINT `cartdetail_ibfk_1` FOREIGN KEY (`CartID`) REFERENCES `cart` (`CartID`) ON DELETE CASCADE,
  CONSTRAINT `cartdetail_ibfk_2` FOREIGN KEY (`InventoryID`) REFERENCES `inventory` (`InventoryID`),
  CONSTRAINT `cartdetail_chk_1` CHECK ((`Quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=280 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `SKUPrefix` varchar(3) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `uq_category_sku_prefix` (`SKUPrefix`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categoryskusequence`
--

DROP TABLE IF EXISTS `categoryskusequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoryskusequence` (
  `CategoryID` int NOT NULL,
  `NextNumber` bigint unsigned NOT NULL,
  PRIMARY KEY (`CategoryID`),
  CONSTRAINT `categoryskusequence_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clippedcoupons`
--

DROP TABLE IF EXISTS `clippedcoupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clippedcoupons` (
  `ClippedCouponID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `CouponID` int NOT NULL,
  `UsesRemaining` int NOT NULL DEFAULT '0',
  `ClippedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ClippedCouponID`),
  UNIQUE KEY `unique_customer_coupon` (`CustomerID`,`CouponID`),
  KEY `fk_clipped_coupon` (`CouponID`),
  CONSTRAINT `fk_clipped_coupon` FOREIGN KEY (`CouponID`) REFERENCES `coupons` (`CouponID`),
  CONSTRAINT `fk_clipped_customer` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`),
  CONSTRAINT `chk_clipped_uses` CHECK ((`UsesRemaining` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `couponcategories`
--

DROP TABLE IF EXISTS `couponcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `couponcategories` (
  `CouponID` int NOT NULL,
  `CategoryID` int NOT NULL,
  PRIMARY KEY (`CouponID`,`CategoryID`),
  KEY `CategoryID` (`CategoryID`),
  CONSTRAINT `couponcategories_ibfk_1` FOREIGN KEY (`CouponID`) REFERENCES `coupons` (`CouponID`) ON DELETE CASCADE,
  CONSTRAINT `couponcategories_ibfk_2` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `couponproducts`
--

DROP TABLE IF EXISTS `couponproducts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `couponproducts` (
  `CouponID` int NOT NULL,
  `InventoryID` int NOT NULL,
  PRIMARY KEY (`CouponID`,`InventoryID`),
  KEY `InventoryID` (`InventoryID`),
  CONSTRAINT `couponproducts_ibfk_1` FOREIGN KEY (`CouponID`) REFERENCES `coupons` (`CouponID`) ON DELETE CASCADE,
  CONSTRAINT `couponproducts_ibfk_2` FOREIGN KEY (`InventoryID`) REFERENCES `inventory` (`InventoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `CouponID` int NOT NULL AUTO_INCREMENT,
  `CouponName` varchar(100) NOT NULL,
  `Description` varchar(500) NOT NULL DEFAULT '',
  `CategoryID` int DEFAULT NULL,
  `TimeStart` timestamp NOT NULL,
  `TimeEnd` timestamp NOT NULL,
  `DiscountAmount` decimal(10,2) NOT NULL,
  `UsesPerClip` int NOT NULL DEFAULT '1',
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CouponID`),
  KEY `CategoryID` (`CategoryID`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`),
  CONSTRAINT `chk_coupon_dates` CHECK ((`TimeEnd` > `TimeStart`)),
  CONSTRAINT `chk_coupon_uses` CHECK ((`UsesPerClip` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `CustomerID` int NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `PhoneNumber` varchar(50) NOT NULL,
  `CustomerAddress` varchar(150) NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ZipCode` varchar(10) DEFAULT NULL,
  `BirthDate` date DEFAULT NULL,
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `uq_customer_phone` (`PhoneNumber`),
  CONSTRAINT `chk_customer_zip` CHECK (regexp_like(`ZipCode`,_utf8mb4'^[0-9]{5}(-[0-9]{4})?$'))
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `customer_check_birthdate` BEFORE INSERT ON `customer` FOR EACH ROW BEGIN
    IF NEW.BirthDate > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Birthdate cannot be in the future.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `update_account` BEFORE UPDATE ON `customer` FOR EACH ROW BEGIN
    IF TRIM(NEW.FirstName) = '' OR TRIM(NEW.LastName) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'First and last name are required.';
    END IF;

    IF NOT (NEW.PhoneNumber <=> OLD.PhoneNumber)
       AND NEW.PhoneNumber REGEXP '([0-9][^0-9]*){11}' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Phone number cannot have more than 10 digits.';
    END IF;

    IF NEW.ZipCode IS NOT NULL
       AND NEW.ZipCode NOT REGEXP '^[0-9]{5}(-[0-9]{4})?$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Enter a valid ZIP code.';
    END IF; 
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `customeraccounts`
--

DROP TABLE IF EXISTS `customeraccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customeraccounts` (
  `CustomerAccountID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `AccountStatus` varchar(20) NOT NULL DEFAULT 'Active',
  `CreatedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CustomerAccountID`),
  UNIQUE KEY `CustomerID` (`CustomerID`),
  UNIQUE KEY `Username` (`Username`),
  CONSTRAINT `customeraccounts_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `create_account` AFTER INSERT ON `customeraccounts` FOR EACH ROW INSERT INTO LoyaltyProgram
    (CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate)
VALUES (NEW.CustomerID, 0, CURRENT_TIMESTAMP, 0, 0, CURRENT_TIMESTAMP) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `deliverytype`
--

DROP TABLE IF EXISTS `deliverytype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverytype` (
  `DeliveryID` int NOT NULL AUTO_INCREMENT,
  `DeliveryName` varchar(50) NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DeliveryID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `EmployeeID` int NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `EmployeeRole` varchar(50) NOT NULL,
  `EmployeePay` decimal(10,2) NOT NULL,
  `PhoneNumber` varchar(50) NOT NULL,
  `EmailAddress` varchar(150) NOT NULL,
  `EmployeeHireDate` date NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`EmployeeID`),
  UNIQUE KEY `uq_employee_email` (`EmailAddress`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `employee_inventory_stock_report`
--

DROP TABLE IF EXISTS `employee_inventory_stock_report`;
/*!50001 DROP VIEW IF EXISTS `employee_inventory_stock_report`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `employee_inventory_stock_report` AS SELECT 
 1 AS `InventoryID`,
 1 AS `SKU`,
 1 AS `InventoryName`,
 1 AS `CategoryID`,
 1 AS `StockQuantity`,
 1 AS `StockStatus`,
 1 AS `ReorderThreshold`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `employeeaccounts`
--

DROP TABLE IF EXISTS `employeeaccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeeaccounts` (
  `EmployeeAccountID` int NOT NULL AUTO_INCREMENT,
  `EmployeeID` int NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `AccountStatus` varchar(20) NOT NULL DEFAULT 'Active',
  `CreatedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`EmployeeAccountID`),
  UNIQUE KEY `EmployeeID` (`EmployeeID`),
  UNIQUE KEY `Username` (`Username`),
  CONSTRAINT `employeeaccounts_ibfk_1` FOREIGN KEY (`EmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employeeplacedorders`
--

DROP TABLE IF EXISTS `employeeplacedorders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeeplacedorders` (
  `TransactionID` int NOT NULL,
  `EmployeeID` int NOT NULL,
  `RequestKey` char(36) NOT NULL,
  PRIMARY KEY (`TransactionID`),
  UNIQUE KEY `uq_employee_order_request` (`EmployeeID`,`RequestKey`),
  CONSTRAINT `employeeplacedorders_ibfk_1` FOREIGN KEY (`TransactionID`) REFERENCES `transactions` (`TransactionID`),
  CONSTRAINT `employeeplacedorders_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employeetimeentries`
--

DROP TABLE IF EXISTS `employeetimeentries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeetimeentries` (
  `TimeEntryID` int NOT NULL AUTO_INCREMENT,
  `EmployeeID` int NOT NULL,
  `ClockInUtc` datetime(6) NOT NULL,
  `ClockOutUtc` datetime(6) DEFAULT NULL,
  `HourlyRate` decimal(10,2) NOT NULL,
  `OpenEmployeeID` int GENERATED ALWAYS AS ((case when (`ClockOutUtc` is null) then `EmployeeID` end)) STORED,
  PRIMARY KEY (`TimeEntryID`),
  UNIQUE KEY `uq_employee_open_time_entry` (`OpenEmployeeID`),
  KEY `idx_employee_time_history` (`EmployeeID`,`ClockInUtc`),
  CONSTRAINT `employeetimeentries_ibfk_1` FOREIGN KEY (`EmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `InventoryID` int NOT NULL AUTO_INCREMENT,
  `SKU` varchar(50) NOT NULL,
  `InventoryName` varchar(50) NOT NULL,
  `CategoryID` int NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `StockQuantity` int NOT NULL,
  `ReorderThreshold` int NOT NULL,
  `RestockTargetQuantity` int DEFAULT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `ImageURL` varchar(255) DEFAULT NULL,
  `ArchivedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`InventoryID`),
  UNIQUE KEY `uq_inventory_sku` (`SKU`),
  UNIQUE KEY `uq_inventory_name` (`InventoryName`),
  KEY `CategoryID` (`CategoryID`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`),
  CONSTRAINT `chk_inventory` CHECK (((`Price` >= 0) and (`StockQuantity` >= 0))),
  CONSTRAINT `chk_inventory_restock_target` CHECK ((`RestockTargetQuantity` > `ReorderThreshold`))
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `low_inventory_report`
--

DROP TABLE IF EXISTS `low_inventory_report`;
/*!50001 DROP VIEW IF EXISTS `low_inventory_report`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `low_inventory_report` AS SELECT 
 1 AS `InventoryID`,
 1 AS `SKU`,
 1 AS `InventoryName`,
 1 AS `CategoryName`,
 1 AS `Price`,
 1 AS `StockQuantity`,
 1 AS `ReorderThreshold`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `loyalty_purchase_activity`
--

DROP TABLE IF EXISTS `loyalty_purchase_activity`;
/*!50001 DROP VIEW IF EXISTS `loyalty_purchase_activity`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `loyalty_purchase_activity` AS SELECT 
 1 AS `CustomerID`,
 1 AS `FirstName`,
 1 AS `LastName`,
 1 AS `PurchaseCount`,
 1 AS `totalSpending`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `loyaltyprogram`
--

DROP TABLE IF EXISTS `loyaltyprogram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyaltyprogram` (
  `LoyaltyProgramID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `CurrentPoints` int NOT NULL,
  `DateJoined` timestamp NOT NULL,
  `TotalPointsEarned` int NOT NULL,
  `TotalPointsRedeemed` int NOT NULL,
  `LastActivityDate` timestamp NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LoyaltyProgramID`),
  UNIQUE KEY `uq_loyalty_customer` (`CustomerID`),
  CONSTRAINT `loyaltyprogram_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orderfulfillment`
--

DROP TABLE IF EXISTS `orderfulfillment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderfulfillment` (
  `FulfillmentID` int NOT NULL AUTO_INCREMENT,
  `TransactionID` int NOT NULL,
  `EmployeeID` int DEFAULT NULL,
  `DeliveryID` int NOT NULL,
  `FulfillmentTime` timestamp NULL DEFAULT NULL,
  `ReadyStatus` tinyint(1) DEFAULT NULL,
  `DeliveryAddress` varchar(150) DEFAULT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` varchar(30) NOT NULL DEFAULT 'Needs Assignment',
  PRIMARY KEY (`FulfillmentID`),
  KEY `TransactionID` (`TransactionID`),
  KEY `EmployeeID` (`EmployeeID`),
  KEY `DeliveryID` (`DeliveryID`),
  CONSTRAINT `orderfulfillment_ibfk_1` FOREIGN KEY (`TransactionID`) REFERENCES `transactions` (`TransactionID`),
  CONSTRAINT `orderfulfillment_ibfk_2` FOREIGN KEY (`EmployeeID`) REFERENCES `employee` (`EmployeeID`),
  CONSTRAINT `orderfulfillment_ibfk_3` FOREIGN KEY (`DeliveryID`) REFERENCES `deliverytype` (`DeliveryID`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orderissues`
--

DROP TABLE IF EXISTS `orderissues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderissues` (
  `IssueID` int NOT NULL AUTO_INCREMENT,
  `FulfillmentID` int NOT NULL,
  `ReportedByEmployeeID` int NOT NULL,
  `IssueType` varchar(32) NOT NULL,
  `Details` varchar(500) NOT NULL,
  `ReportedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ManagerResponse` varchar(500) DEFAULT NULL,
  `RespondedByEmployeeID` int DEFAULT NULL,
  `RespondedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`IssueID`),
  KEY `idx_order_issue_reporter` (`ReportedByEmployeeID`,`FulfillmentID`),
  KEY `FulfillmentID` (`FulfillmentID`),
  KEY `RespondedByEmployeeID` (`RespondedByEmployeeID`),
  CONSTRAINT `orderissues_ibfk_1` FOREIGN KEY (`FulfillmentID`) REFERENCES `orderfulfillment` (`FulfillmentID`),
  CONSTRAINT `orderissues_ibfk_2` FOREIGN KEY (`ReportedByEmployeeID`) REFERENCES `employee` (`EmployeeID`),
  CONSTRAINT `orderissues_ibfk_3` FOREIGN KEY (`RespondedByEmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orderpackeditems`
--

DROP TABLE IF EXISTS `orderpackeditems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderpackeditems` (
  `FulfillmentID` int NOT NULL,
  `TransactionItemID` int NOT NULL,
  PRIMARY KEY (`FulfillmentID`,`TransactionItemID`),
  KEY `TransactionItemID` (`TransactionItemID`),
  CONSTRAINT `orderpackeditems_ibfk_1` FOREIGN KEY (`FulfillmentID`) REFERENCES `orderfulfillment` (`FulfillmentID`),
  CONSTRAINT `orderpackeditems_ibfk_2` FOREIGN KEY (`TransactionItemID`) REFERENCES `transactionitems` (`TransactionItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productimages`
--

DROP TABLE IF EXISTS `productimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productimages` (
  `InventoryID` int NOT NULL,
  `ContentType` varchar(32) NOT NULL,
  `ImageData` mediumblob NOT NULL,
  PRIMARY KEY (`InventoryID`),
  CONSTRAINT `fk_product_images_inventory` FOREIGN KEY (`InventoryID`) REFERENCES `inventory` (`InventoryID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productreturns`
--

DROP TABLE IF EXISTS `productreturns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productreturns` (
  `ReturnID` int NOT NULL AUTO_INCREMENT,
  `QuantityReturned` int NOT NULL,
  `RefundTotal` decimal(10,2) NOT NULL,
  `ReturnDate` timestamp NOT NULL,
  `Disposable` tinyint(1) NOT NULL,
  `TransactionItemID` int NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` varchar(20) NOT NULL DEFAULT 'Approved',
  `Reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ReturnID`),
  KEY `TransactionItemID` (`TransactionItemID`),
  CONSTRAINT `productreturns_ibfk_1` FOREIGN KEY (`TransactionItemID`) REFERENCES `transactionitems` (`TransactionItemID`),
  CONSTRAINT `chk_return_qty` CHECK ((`QuantityReturned` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `check_return_window` BEFORE INSERT ON `productreturns` FOR EACH ROW BEGIN
    IF EXISTS (
        SELECT 1
        FROM TransactionItems AS ti
        JOIN Transactions AS t
          ON t.TransactionID = ti.TransactionID
        WHERE ti.TransactionItemID = NEW.TransactionItemID
          AND DATEDIFF(DATE(NEW.ReturnDate), t.TransactionDate) > 3
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Return rejected: the 3-day return window has expired.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `report_loyalty_locations`
--

DROP TABLE IF EXISTS `report_loyalty_locations`;
/*!50001 DROP VIEW IF EXISTS `report_loyalty_locations`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `report_loyalty_locations` AS SELECT 
 1 AS `ZipCode`,
 1 AS `MemberCount`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `report_loyalty_points`
--

DROP TABLE IF EXISTS `report_loyalty_points`;
/*!50001 DROP VIEW IF EXISTS `report_loyalty_points`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `report_loyalty_points` AS SELECT 
 1 AS `CustomerID`,
 1 AS `FirstName`,
 1 AS `LastName`,
 1 AS `CustomerAddress`,
 1 AS `DateJoined`,
 1 AS `CurrentPoints`,
 1 AS `TotalPointsEarned`,
 1 AS `TotalPointsRedeemed`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `report_loyalty_summary`
--

DROP TABLE IF EXISTS `report_loyalty_summary`;
/*!50001 DROP VIEW IF EXISTS `report_loyalty_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `report_loyalty_summary` AS SELECT 
 1 AS `CustomerID`,
 1 AS `FirstName`,
 1 AS `LastName`,
 1 AS `CustomerAddress`,
 1 AS `DateJoined`,
 1 AS `CurrentPoints`,
 1 AS `TotalPointsEarned`,
 1 AS `TotalPointsRedeemed`,
 1 AS `PurchaseCount`,
 1 AS `totalSpending`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `restockrequesthistory`
--

DROP TABLE IF EXISTS `restockrequesthistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restockrequesthistory` (
  `HistoryID` int NOT NULL AUTO_INCREMENT,
  `RequestID` int NOT NULL,
  `OldStatus` varchar(20) NOT NULL,
  `NewStatus` varchar(20) NOT NULL,
  `ReviewedByEmployeeID` int DEFAULT NULL,
  `ManagerNote` varchar(500) DEFAULT NULL,
  `ChangedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`HistoryID`),
  KEY `fk_restock_history_request` (`RequestID`),
  KEY `fk_restock_history_reviewer` (`ReviewedByEmployeeID`),
  CONSTRAINT `fk_restock_history_request` FOREIGN KEY (`RequestID`) REFERENCES `restockrequests` (`RequestID`),
  CONSTRAINT `fk_restock_history_reviewer` FOREIGN KEY (`ReviewedByEmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `restockrequests`
--

DROP TABLE IF EXISTS `restockrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restockrequests` (
  `RequestID` int NOT NULL AUTO_INCREMENT,
  `InventoryID` int NOT NULL,
  `RequestedByEmployeeID` int NOT NULL,
  `RequestedQuantity` int NOT NULL,
  `StockAtRequest` int NOT NULL,
  `EmployeeNote` varchar(500) DEFAULT NULL,
  `Status` enum('Pending','Approved','Rejected','Fulfilled') NOT NULL DEFAULT 'Pending',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ReviewedByEmployeeID` int DEFAULT NULL,
  `ReviewedAt` timestamp NULL DEFAULT NULL,
  `ManagerNote` varchar(500) DEFAULT NULL,
  `FulfilledAt` timestamp NULL DEFAULT NULL,
  `OpenInventoryID` int GENERATED ALWAYS AS ((case when (`Status` in (_utf8mb4'Pending',_utf8mb4'Approved')) then `InventoryID` else NULL end)) STORED,
  PRIMARY KEY (`RequestID`),
  UNIQUE KEY `uq_restock_open_product` (`OpenInventoryID`),
  KEY `fk_restock_inventory` (`InventoryID`),
  KEY `fk_restock_requester` (`RequestedByEmployeeID`),
  KEY `fk_restock_reviewer` (`ReviewedByEmployeeID`),
  CONSTRAINT `fk_restock_inventory` FOREIGN KEY (`InventoryID`) REFERENCES `inventory` (`InventoryID`),
  CONSTRAINT `fk_restock_requester` FOREIGN KEY (`RequestedByEmployeeID`) REFERENCES `employee` (`EmployeeID`),
  CONSTRAINT `fk_restock_reviewer` FOREIGN KEY (`ReviewedByEmployeeID`) REFERENCES `employee` (`EmployeeID`),
  CONSTRAINT `chk_restock_quantity` CHECK ((`RequestedQuantity` > 0)),
  CONSTRAINT `chk_restock_stock` CHECK ((`StockAtRequest` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `restock_request_status_history` AFTER UPDATE ON `restockrequests` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `returnrequests`
--

DROP TABLE IF EXISTS `returnrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returnrequests` (
  `ReturnRequestID` int NOT NULL AUTO_INCREMENT,
  `TransactionItemID` int NOT NULL,
  `Quantity` int NOT NULL,
  `Reason` varchar(50) NOT NULL,
  `Details` varchar(500) DEFAULT NULL,
  `ExpectedRefund` decimal(10,2) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Requested',
  `ReturnID` int DEFAULT NULL,
  `RequestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReturnRequestID`),
  KEY `TransactionItemID` (`TransactionItemID`),
  KEY `ReturnID` (`ReturnID`),
  CONSTRAINT `returnrequests_ibfk_1` FOREIGN KEY (`TransactionItemID`) REFERENCES `transactionitems` (`TransactionItemID`),
  CONSTRAINT `returnrequests_ibfk_2` FOREIGN KEY (`ReturnID`) REFERENCES `productreturns` (`ReturnID`),
  CONSTRAINT `chk_request_qty` CHECK ((`Quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `check_return_quantity` BEFORE INSERT ON `returnrequests` FOR EACH ROW BEGIN
    DECLARE purchased INT;

    SELECT Quantity INTO purchased
    FROM TransactionItems
    WHERE TransactionItemID = NEW.TransactionItemID;

    IF NEW.Quantity > purchased THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot return more than purchased.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `transactionitems`
--

DROP TABLE IF EXISTS `transactionitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactionitems` (
  `TransactionItemID` int NOT NULL AUTO_INCREMENT,
  `TransactionID` int NOT NULL,
  `InventoryID` int NOT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(10,2) NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionItemID`),
  KEY `TransactionID` (`TransactionID`),
  KEY `InventoryID` (`InventoryID`),
  CONSTRAINT `transactionitems_ibfk_1` FOREIGN KEY (`TransactionID`) REFERENCES `transactions` (`TransactionID`),
  CONSTRAINT `transactionitems_ibfk_2` FOREIGN KEY (`InventoryID`) REFERENCES `inventory` (`InventoryID`),
  CONSTRAINT `chk_item_qty` CHECK ((`Quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `check_order_stock` BEFORE INSERT ON `transactionitems` FOR EACH ROW BEGIN
    IF NEW.Quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Quantity must be greater than zero.';
    END IF;

    UPDATE Inventory
    SET StockQuantity = StockQuantity - NEW.Quantity
    WHERE InventoryID = NEW.InventoryID
      AND StockQuantity >= NEW.Quantity
      AND IsActive = TRUE;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Order rejected: insufficient stock or item unavailable.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`groceryadmin`@`%`*/ /*!50003 TRIGGER `check_alcohol_purchase_age` BEFORE INSERT ON `transactionitems` FOR EACH ROW BEGIN
    IF EXISTS (
        SELECT 1
        FROM Inventory AS item
        JOIN Category AS category 
            ON category.CategoryID = item.CategoryID
        JOIN Transactions AS sale 
            ON sale.TransactionID = NEW.TransactionID
        JOIN Customer AS customer 
            ON customer.CustomerID = sale.CustomerID
        WHERE item.InventoryID = NEW.InventoryID
          AND category.SKUPrefix = 'ALC' 
          AND (
              customer.BirthDate IS NULL OR 
              TIMESTAMPDIFF(YEAR, customer.BirthDate, sale.TransactionDate) < 21
          )
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MYSQL_ERRNO = 30021,
                MESSAGE_TEXT = 'Alcohol purchases require an age of 21 or older.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `TransactionMethod` varchar(100) NOT NULL,
  `TotalPrice` decimal(10,2) NOT NULL,
  `TransactionDate` date NOT NULL,
  `PointsEarned` int NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DeliveryFee` decimal(10,2) DEFAULT NULL,
  `LoyaltyDiscount` decimal(10,2) DEFAULT NULL,
  `PointsRedeemed` int DEFAULT NULL,
  PRIMARY KEY (`TransactionID`),
  KEY `CustomerID` (`CustomerID`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usedcoupons`
--

DROP TABLE IF EXISTS `usedcoupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usedcoupons` (
  `CustomerCouponID` int NOT NULL AUTO_INCREMENT,
  `CustomerID` int NOT NULL,
  `CouponID` int NOT NULL,
  `ClippedAt` timestamp NOT NULL,
  `Used` tinyint(1) NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CustomerCouponID`),
  KEY `CustomerID` (`CustomerID`),
  KEY `CouponID` (`CouponID`),
  CONSTRAINT `usedcoupons_ibfk_1` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`),
  CONSTRAINT `usedcoupons_ibfk_2` FOREIGN KEY (`CouponID`) REFERENCES `coupons` (`CouponID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workschedule`
--

DROP TABLE IF EXISTS `workschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workschedule` (
  `ScheduleID` int NOT NULL AUTO_INCREMENT,
  `EmployeeID` int NOT NULL,
  `Weekday` varchar(10) NOT NULL,
  `StartTime` time NOT NULL,
  `EndTime` time NOT NULL,
  `TableUpdateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ScheduleID`),
  KEY `EmployeeID` (`EmployeeID`),
  CONSTRAINT `workschedule_ibfk_1` FOREIGN KEY (`EmployeeID`) REFERENCES `employee` (`EmployeeID`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `employee_inventory_stock_report`
--

/*!50001 DROP VIEW IF EXISTS `employee_inventory_stock_report`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `employee_inventory_stock_report` AS select `inventory`.`InventoryID` AS `InventoryID`,`inventory`.`SKU` AS `SKU`,`inventory`.`InventoryName` AS `InventoryName`,`inventory`.`CategoryID` AS `CategoryID`,`inventory`.`StockQuantity` AS `StockQuantity`,(case when (`inventory`.`StockQuantity` = 0) then 'Out of stock' when (`inventory`.`StockQuantity` < `inventory`.`ReorderThreshold`) then 'Low' when (`inventory`.`StockQuantity` >= 75) then 'High' else 'Normal' end) AS `StockStatus`,`inventory`.`ReorderThreshold` AS `ReorderThreshold` from `inventory` where (`inventory`.`IsActive` = true) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `low_inventory_report`
--

/*!50001 DROP VIEW IF EXISTS `low_inventory_report`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `low_inventory_report` AS select `i`.`InventoryID` AS `InventoryID`,`i`.`SKU` AS `SKU`,`i`.`InventoryName` AS `InventoryName`,`c`.`CategoryName` AS `CategoryName`,`i`.`Price` AS `Price`,`i`.`StockQuantity` AS `StockQuantity`,`i`.`ReorderThreshold` AS `ReorderThreshold` from (`inventory` `i` join `category` `c` on((`i`.`CategoryID` = `c`.`CategoryID`))) where ((`i`.`IsActive` = 1) and (`i`.`StockQuantity` <= `i`.`ReorderThreshold`)) order by `i`.`StockQuantity` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `loyalty_purchase_activity`
--

/*!50001 DROP VIEW IF EXISTS `loyalty_purchase_activity`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `loyalty_purchase_activity` AS select `l`.`CustomerID` AS `CustomerID`,`l`.`FirstName` AS `FirstName`,`l`.`LastName` AS `LastName`,count(`t`.`TransactionID`) AS `PurchaseCount`,sum(`t`.`TotalPrice`) AS `totalSpending` from (`report_loyalty_points` `l` left join `transactions` `t` on((`l`.`CustomerID` = `t`.`CustomerID`))) group by `l`.`CustomerID`,`l`.`FirstName`,`l`.`LastName` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `report_loyalty_locations`
--

/*!50001 DROP VIEW IF EXISTS `report_loyalty_locations`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `report_loyalty_locations` AS select left(`c`.`ZipCode`,5) AS `ZipCode`,count(0) AS `MemberCount` from (`report_loyalty_points` `p` join `customer` `c` on((`c`.`CustomerID` = `p`.`CustomerID`))) group by left(`c`.`ZipCode`,5) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `report_loyalty_points`
--

/*!50001 DROP VIEW IF EXISTS `report_loyalty_points`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `report_loyalty_points` AS select `c`.`CustomerID` AS `CustomerID`,`c`.`FirstName` AS `FirstName`,`c`.`LastName` AS `LastName`,`c`.`CustomerAddress` AS `CustomerAddress`,`lp`.`DateJoined` AS `DateJoined`,`lp`.`CurrentPoints` AS `CurrentPoints`,`lp`.`TotalPointsEarned` AS `TotalPointsEarned`,`lp`.`TotalPointsRedeemed` AS `TotalPointsRedeemed` from (`customer` `c` join `loyaltyprogram` `lp` on((`c`.`CustomerID` = `lp`.`CustomerID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `report_loyalty_summary`
--

/*!50001 DROP VIEW IF EXISTS `report_loyalty_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`groceryadmin`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `report_loyalty_summary` AS select `lp`.`CustomerID` AS `CustomerID`,`lp`.`FirstName` AS `FirstName`,`lp`.`LastName` AS `LastName`,`lp`.`CustomerAddress` AS `CustomerAddress`,`lp`.`DateJoined` AS `DateJoined`,`lp`.`CurrentPoints` AS `CurrentPoints`,`lp`.`TotalPointsEarned` AS `TotalPointsEarned`,`lp`.`TotalPointsRedeemed` AS `TotalPointsRedeemed`,`pa`.`PurchaseCount` AS `PurchaseCount`,`pa`.`totalSpending` AS `totalSpending` from (`report_loyalty_points` `lp` join `loyalty_purchase_activity` `pa` on((`lp`.`CustomerID` = `pa`.`CustomerID`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-12  1:07:25
