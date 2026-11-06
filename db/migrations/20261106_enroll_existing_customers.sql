-- Enroll existing customer accounts that predate automatic signup enrollment.
-- Preserve all existing memberships and their point balances. Safe to rerun.
INSERT INTO LoyaltyProgram
    (CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate)
SELECT DISTINCT c.CustomerID, 0, NOW(), 0, 0, NOW()
FROM Customer c
JOIN CustomerAccounts ca ON ca.CustomerID = c.CustomerID
WHERE NOT EXISTS (
    SELECT 1 FROM LoyaltyProgram lp WHERE lp.CustomerID = c.CustomerID
);
