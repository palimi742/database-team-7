DELIMITER // CREATE TRIGGER grocery_store.check_produce_return BEFORE
INSERT ON grocery_store.returnrequests FOR EACH ROW BEGIN IF EXISTS (
        SELECT 1
        FROM grocery_store.transactionitems AS purchased
            JOIN grocery_store.inventory AS item ON item.InventoryID = purchased.InventoryID
            JOIN grocery_store.category AS category ON category.CategoryID = item.CategoryID
        WHERE purchased.TransactionItemID = NEW.TransactionItemID
            AND category.SKUPrefix = 'PRD'
    ) THEN SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Produce items cannot be returned.';
END IF;
END // DELIMITER;