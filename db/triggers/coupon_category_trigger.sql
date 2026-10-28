DELIMITER //

CREATE TRIGGER coupon_category
BEFORE INSERT ON Coupons
FOR EACH ROW
BEGIN
    IF NEW.TimeEnd <= NEW.TimeStart THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Coupon rejected, end time must be after start time.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM Coupons
        WHERE CategoryID = NEW.CategoryID
          AND NEW.TimeStart < TimeEnd
          AND NEW.TimeEnd > TimeStart
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Coupon is rejected,another coupon exists in this category.';
    END IF;
END //

DELIMITER ;




