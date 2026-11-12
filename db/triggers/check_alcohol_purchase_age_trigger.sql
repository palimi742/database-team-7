USE grocery_store;

DELIMITER //

CREATE TRIGGER check_alcohol_purchase_age
BEFORE INSERT ON TransactionItems
FOR EACH ROW
BEGIN
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
END//

DELIMITER ;
