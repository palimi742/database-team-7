DROP TRIGGER IF EXISTS check_return_quantity;

DELIMITER //

CREATE TRIGGER check_return_quantity
BEFORE INSERT ON ReturnRequests
FOR EACH ROW
BEGIN
    DECLARE purchased INT;

    SELECT Quantity INTO purchased
    FROM TransactionItems
    WHERE TransactionItemID = NEW.TransactionItemID;

    IF NEW.Quantity > purchased THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot return more than purchased.';
    END IF;
END //

DELIMITER ;
