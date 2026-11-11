DELIMITER //

CREATE TRIGGER update_account
BEFORE UPDATE ON Customer
FOR EACH ROW
BEGIN
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
END //

DELIMITER ;