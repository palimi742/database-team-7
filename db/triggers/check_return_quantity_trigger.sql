DROP TRIGGER IF EXISTS check_return_quantity;

DELIMITER //

CREATE TRIGGER check_return_quantity
BEFORE INSERT ON ReturnRequests
FOR EACH ROW
BEGIN
    DECLARE remaining INT DEFAULT 0;
    DECLARE error_message VARCHAR(128);

    SELECT Quantity INTO remaining
    FROM TransactionItems
    WHERE TransactionItemID = NEW.TransactionItemID
    FOR UPDATE;

    SET remaining = remaining - (
        SELECT COALESCE(SUM(Quantity), 0)
        FROM ReturnRequests
        WHERE TransactionItemID = NEW.TransactionItemID
          AND Status <> 'Rejected'
    );

    SET remaining = remaining - (
        SELECT COALESCE(SUM(QuantityReturned), 0)
        FROM ProductReturns
        WHERE TransactionItemID = NEW.TransactionItemID
          AND Status = 'Approved'
          AND ReturnID NOT IN (
              SELECT ReturnID FROM ReturnRequests
              WHERE ReturnID IS NOT NULL
          )
    );

    SET remaining = GREATEST(remaining, 0);

    IF NEW.Quantity > remaining THEN
        SET error_message = CONCAT(
            'Return rejected: you can return at most ',
            remaining,
            IF(remaining = 1, ' more unit of this item.', ' more units of this item.')
        );
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = error_message;
    END IF;
END //

DELIMITER ;