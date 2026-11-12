DELIMITER //

CREATE TRIGGER check_order_stock
BEFORE INSERT ON TransactionItems
FOR EACH ROW
BEGIN
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
END //

DELIMITER ;