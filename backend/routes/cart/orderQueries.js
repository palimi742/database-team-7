  // Shared SQL pieces
export const STATUS_SQL = `CASE
      WHEN f.FulfillmentID IS NULL THEN 'Completed'
      WHEN f.FulfillmentTime IS NOT NULL THEN 'Completed'
      WHEN f.ReadyStatus = 1 THEN 'Ready'
      ELSE 'Preparing' END`;

  // Quantity already returned or requested for an item
export const returnedQtySql = (itemRef) => `(
      (SELECT COALESCE(SUM(rr.Quantity), 0) FROM ReturnRequests rr
        WHERE rr.TransactionItemID = ${itemRef} AND rr.Status <> 'Rejected')
    + (SELECT COALESCE(SUM(pr.QuantityReturned), 0) FROM ProductReturns pr
        WHERE pr.TransactionItemID = ${itemRef}
          AND pr.ReturnID NOT IN (SELECT rr2.ReturnID FROM ReturnRequests rr2
                                  WHERE rr2.ReturnID IS NOT NULL))
  )`;

