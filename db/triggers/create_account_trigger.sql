CREATE TRIGGER create_account
AFTER INSERT ON CustomerAccounts
FOR EACH ROW
INSERT INTO LoyaltyProgram
    (CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate)
VALUES (NEW.CustomerID, 0, CURRENT_TIMESTAMP, 0, 0, CURRENT_TIMESTAMP);
    