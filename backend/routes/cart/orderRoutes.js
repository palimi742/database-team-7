import { asyncHandler as ah, requireLogin } from "./cartMiddleware.js";
import { STATUS_SQL, returnedQtySql, returnCountSql } from "./orderQueries.js";
import { RETURN_WINDOW_DAYS } from "./cartHelpers.js";
import { createPaginator } from "./pagination.js";

export function registerOrderRoutes(router, pool) {
  const sendPage = createPaginator(pool);
  router.get(
    "/my-orders/items/:itemId/image",
    requireLogin,
    ah(async (req, res) => {
      const [[image]] = await pool.execute(
        `SELECT p.ContentType, p.ImageData
         FROM TransactionItems ti
         JOIN Transactions t ON t.TransactionID = ti.TransactionID
         JOIN ProductImages p ON p.InventoryID = ti.InventoryID
         WHERE ti.TransactionItemID = ? AND t.CustomerID = ?`,
        [req.params.itemId, req.customerId],
      );
      if (!image) return res.sendStatus(404);
      res.set("Content-Type", image.ContentType);
      res.set("Cache-Control", "private, no-store");
      return res.send(image.ImageData);
    }),
  );
  router.get(
    "/my-orders",
    requireLogin,
    ah(async (req, res) => {
      if (req.query.page !== undefined) {
        const status = req.query.status ?? "not-completed";
        if (!["completed", "not-completed"].includes(status)) {
          return res
            .status(400)
            .json({ error: "Choose a valid order status." });
        }
        const fromSql = `FROM Transactions t
          LEFT JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
          LEFT JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
          WHERE t.CustomerID = ? AND ${
            status === "completed"
              ? "(f.FulfillmentID IS NULL OR f.FulfillmentTime IS NOT NULL)"
              : "(f.FulfillmentID IS NOT NULL AND f.FulfillmentTime IS NULL)"
          }`;
        return sendPage(
          req,
          res,
          `SELECT COUNT(*) AS total ${fromSql}`,
          `SELECT t.TransactionID AS id, t.TotalPrice AS total, ${returnCountSql} AS returnRequestCount,
            DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
            d.DeliveryName AS fulfillmentType, ${STATUS_SQL} AS status
            ${fromSql} ORDER BY t.TransactionID DESC LIMIT ? OFFSET ?`,
          [req.customerId],
          async (orders) => {
            const [previews] = await pool.query(
              `SELECT orderId, id, name, imageURL, itemCount FROM (
                SELECT ti.TransactionID AS orderId, ti.TransactionItemID AS id,
                  i.InventoryName AS name, CASE WHEN i.ImageURL = CONCAT('/api/products/', i.InventoryID, '/image')
                  THEN CONCAT('/api/my-orders/items/', ti.TransactionItemID, '/image')
                  ELSE i.ImageURL END AS imageURL,
                  COUNT(*) OVER (PARTITION BY ti.TransactionID) AS itemCount,
                  ROW_NUMBER() OVER (
                    PARTITION BY ti.TransactionID ORDER BY ti.TransactionItemID
                  ) AS position
                FROM TransactionItems ti
                JOIN Inventory i ON i.InventoryID = ti.InventoryID
                WHERE ti.TransactionID IN (?)
              ) AS rankedItems
              WHERE position <= 4
              ORDER BY orderId, position`,
              [orders.map((order) => order.id)],
            );
            for (const order of orders) {
              order.previewItems = previews.filter(
                (item) => item.orderId === order.id,
              );
              order.extraItemCount =
                Number(order.previewItems[0]?.itemCount ?? 0) -
                order.previewItems.length;
            }
          },
        );
      }
      const [rows] = await pool.query(
        `SELECT t.TransactionID AS id, t.TotalPrice AS total, ${returnCountSql} AS returnRequestCount,
              DATE_FORMAT(t.TransactionDate, '%Y-%m-%d') AS orderDate,
              d.DeliveryName AS fulfillmentType, ${STATUS_SQL} AS status
       FROM Transactions t
       LEFT JOIN OrderFulfillment f ON f.TransactionID = t.TransactionID
       LEFT JOIN DeliveryType d ON d.DeliveryID = f.DeliveryID
       WHERE t.CustomerID = ?
       ORDER BY t.TransactionID DESC`,
        [req.customerId],
      );
      res.json(rows);
    }),
  );

  router.get(
    "/my-returns",
    requireLogin,
    ah(async (req, res) => {
      const statuses = {
        pending: "Requested",
        approved: "Approved",
        rejected: "Rejected",
      };
      const status = req.query.status;
      if (status !== undefined && !Object.hasOwn(statuses, status)) {
        return res.status(400).json({ error: "Choose a valid return status." });
      }
      const fromSql = `FROM ReturnRequests r
        JOIN TransactionItems ti ON ti.TransactionItemID = r.TransactionItemID
        JOIN Transactions t ON t.TransactionID = ti.TransactionID
        JOIN Inventory i ON i.InventoryID = ti.InventoryID
        WHERE t.CustomerID = ?${status !== undefined ? " AND r.Status = ?" : ""}`;
      return sendPage(
        req,
        res,
        `SELECT COUNT(*) AS total ${fromSql}`,
        `SELECT r.ReturnRequestID AS id, t.TransactionID AS orderId,
          r.Quantity AS quantity, r.Reason AS reason, r.Status AS status,
          DATE_FORMAT(r.RequestedAt, '%Y-%m-%d') AS requestedDate,
          i.InventoryName AS name ${fromSql}
          ORDER BY r.RequestedAt DESC, r.ReturnRequestID DESC LIMIT ? OFFSET ?`,
        status !== undefined
          ? [req.customerId, statuses[status]]
          : [req.customerId],
      );
    }),
  );

  // Order details, purchased items, and completed returns.
  router.get(
    "/my-orders/:orderId",
    requireLogin,
    ah(async (req, res) => {
      const [orderRows] = await pool.query(
        `SELECT purchase.TransactionID AS id,
                DATE_FORMAT(purchase.TransactionDate, '%Y-%m-%d') AS orderDate,
                purchase.TransactionMethod AS paymentMethod,
                purchase.TotalPrice AS total, purchase.PointsEarned AS points,
                purchase.DeliveryFee AS savedDeliveryFee,
                purchase.LoyaltyDiscount AS savedLoyaltyDiscount,
                purchase.PointsRedeemed AS pointsRedeemed,
                (SELECT COALESCE(SUM(orderItem.UnitPrice * orderItem.Quantity), 0)
                 FROM TransactionItems AS orderItem
                 WHERE orderItem.TransactionID = purchase.TransactionID) AS subtotal,
                customer.FirstName AS firstName, customer.LastName AS lastName,
                customer.PhoneNumber AS phone,
                deliveryType.DeliveryName AS fulfillmentType,
                fulfillment.DeliveryAddress AS deliveryAddress,
                CASE
                  WHEN fulfillment.FulfillmentID IS NULL THEN 'Completed'
                  WHEN fulfillment.FulfillmentTime IS NOT NULL THEN 'Completed'
                  WHEN fulfillment.ReadyStatus = 1 THEN 'Ready'
                  ELSE 'Preparing'
                END AS status
         FROM Transactions AS purchase
         JOIN Customer AS customer ON customer.CustomerID = purchase.CustomerID
         LEFT JOIN OrderFulfillment AS fulfillment
           ON fulfillment.TransactionID = purchase.TransactionID
         LEFT JOIN DeliveryType AS deliveryType
           ON deliveryType.DeliveryID = fulfillment.DeliveryID
         WHERE purchase.TransactionID = ? AND purchase.CustomerID = ?`,
        [req.params.orderId, req.customerId],
      );
      const order = orderRows[0];
      if (!order) return res.status(404).json({ error: "Order not found." });

      const [orderItems] = await pool.query(
        `SELECT orderItem.TransactionItemID AS id,
                product.InventoryName AS name, CASE WHEN product.ImageURL = CONCAT('/api/products/', product.InventoryID, '/image')
                  THEN CONCAT('/api/my-orders/items/', orderItem.TransactionItemID, '/image')
                  ELSE product.ImageURL END AS imageURL,
                orderItem.Quantity AS quantity,
                orderItem.UnitPrice AS unitPrice,
                CAST(${returnedQtySql("orderItem.TransactionItemID")} AS SIGNED) AS returnedQty
         FROM TransactionItems AS orderItem
         JOIN Inventory AS product ON product.InventoryID = orderItem.InventoryID
         WHERE orderItem.TransactionID = ?`,
        [order.id],
      );
      const [returnRequests] = await pool.query(
        `SELECT returnRequest.ReturnRequestID AS id,
                returnRequest.TransactionItemID AS itemId,
                returnRequest.Quantity AS quantity,
                returnRequest.ExpectedRefund AS refundTotal,
                returnRequest.Reason AS reason,
                returnRequest.Status AS status,
                product.InventoryName AS name
         FROM ReturnRequests AS returnRequest
         JOIN TransactionItems AS orderItem
           ON orderItem.TransactionItemID = returnRequest.TransactionItemID
         JOIN Inventory AS product ON product.InventoryID = orderItem.InventoryID
         WHERE orderItem.TransactionID = ?
         ORDER BY returnRequest.ReturnRequestID DESC`,
        [order.id],
      );

      const deliveryFee = Math.max(
        0,
        Math.round((Number(order.total) - Number(order.subtotal)) * 100) / 100,
      );
      res.json({
        ...order,
        // Older orders did not retain fees or redemption amounts. Preserve their
        // existing fee calculation and explain any net discount without inventing
        // a points count or applying today's delivery pricing to past orders.
        deliveryFee: Number(order.savedDeliveryFee ?? deliveryFee),
        loyaltyDiscount: Number(
          order.savedLoyaltyDiscount ??
            Math.max(
              0,
              Math.round((Number(order.subtotal) - Number(order.total)) * 100) /
                100,
            ),
        ),
        redemptionEstimated: order.savedLoyaltyDiscount == null,
        items: orderItems,
        returns: returnRequests,
        returnWindowDays: RETURN_WINDOW_DAYS,
      });
    }),
  );
}
