-- Assign the order to the right employee and mark it ready
USE DATABASE grocery_store;
UPDATE OrderFulfillment SET EmployeeID = 2, ReadyStatus = 1 WHERE TransactionID = 1;

-- Mark it picked up or delivered
UPDATE OrderFulfillment SET FulfillmentTime = NOW() WHERE TransactionID = 1;

-- See pending return requests
SELECT * FROM ReturnRequests WHERE Status = 'Requested';

-- Approve request 1: record the official return, then link it
INSERT INTO ProductReturns (QuantityReturned, RefundTotal, ReturnDate, Disposable, TransactionItemID)
SELECT Quantity, ExpectedRefund, NOW(), 0, TransactionItemID
FROM ReturnRequests WHERE ReturnRequestID = 1;

UPDATE ReturnRequests SET Status = 'Approved', ReturnID = LAST_INSERT_ID()
WHERE ReturnRequestID = 1;

-- Or reject it
UPDATE ReturnRequests SET Status = 'Rejected' WHERE ReturnRequestID = 2;
