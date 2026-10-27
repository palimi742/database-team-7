
DELIMITER //

CREATE TRIGGER check_return_window
BEFORE INSERT ON ProductReturns
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM TransactionItems ti
        JOIN Transactions t
            ON ti.TransactionID = t.TransactionID
        WHERE ti.TransactionItemID = NEW.TransactionItemID
          AND DATEDIFF(
              DATE(NEW.ReturnDate),
              t.TransactionDate
          ) > 14
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Return rejected: the 14-day return window has expired.';
    END IF;

END //

DELIMITER ;
