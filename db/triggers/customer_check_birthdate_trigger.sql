USE grocery_store;

DELIMITER //

CREATE TRIGGER customer_check_birthdate
BEFORE INSERT ON Customer
FOR EACH ROW
BEGIN
    IF NEW.BirthDate > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Birthdate cannot be in the future.';
    END IF;
END//

DELIMITER ;
