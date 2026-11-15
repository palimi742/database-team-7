# Point of Sale (POS) - COSC 3380 Databases

## Team 7: Grocery Store System

#### Introduction

The grocery store Point of Sale (POS) system is called FreshMart, a database application used to manage customer purchases, employee dashboards, and manager operations. The system will allow customers to place orders by adding items to their cart, allowing for customer transactions and returns. Managers will be able to assign tasks to employees, add or edit products, confirm or reject returns, and view analytics. Additionally, the employee dashboard will allow employees to view inventory, request more stock when quantities are low, process assigned orders, and view their past order history. The purpose of Freshmart is to facilitate customer purchases and deliveries, maintain inventory stock, help managers monitor store analytics, and allow employees to complete customer orders quickly and efficiently.

#### Types of Data that can be Added, Modified, and Edited

FreshMart stores data in its database across different tables within its schema, depending on the type of information being stored. For example, the Customer table stores information such as customerID, firstName, lastName, and other customer details. There are many aspects of the system where data can be added, modified, and edited across the different user roles.

- **Customers** can create an account, which adds their information to the Customer table in the database. When a customer logs into their account, they can edit or modify information such as their name and birthdate, updating the existing data in the database. Customers can also add data when placing an order, as a new record is added to the Orders table and an orderID is generated.

- **Employees** can submit restock requests for products that are low or out of stock. This adds a new record to the RestockRequests table, which is then reviewed by a manager. The manager can approve or reject the request. Once the requested items arrive, the manager can confirm the restock and update the product quantity in the         Inventory table.

- **Managers** can add new products or coupons to the store. If any errors are present, they can edit or modify existing products and coupons. Furthermore, they can add new categories and edit existing categories depending on changes to the store's inventory. They can also remove products or coupons if they are no longer needed by archiving them instead of permanently deleting them, so they do not affect existing orders or previous transactions.


#### Types of User Roles

The system has three different roles: customer, employee, and manager, each possessing different privileges and permissions.

- **Customers:** Customers can shop on the website, add items to their cart, make transactions, use loyalty points, edit their accounts, use existing coupons, and request returns for items they have purchased. They are not allowed to view the available inventory quantities for each product, add products to the store, or access employee and manager dashboards.

- **Employees:** Employees can place orders for customers, view their work hours and pay, process their assigned orders, and submit restock requests to managers when a product is low in stock. They cannot access store analytics and reports, assign orders to other employees, process customer return requests, approve employee restock requests, or add, delete, or edit existing products and coupons.

- **Managers:** Managers can add, edit, and modify coupons and products, view analytical reports such as sales and loyalty point reports, process customer return requests, assign employees to customer orders, and approve or reject employee restock requests. They cannot directly process customer orders, as that is the employee's responsibility, or edit existing customer orders.

#### Semantic Constraints Which Are Implemented as Triggers

There are many different triggers implemented in the system. Two examples include:

  1. Alcohol Purchase Age Restriction

     Customers under the age of 21 cannot purchase alcohol. A trigger will calculate the customer's age using the birthdate entered in their account when they attempt to place an order containing alcohol. If the customer is under 21, the order will be rejected, and a pop-up message will appear on the purchasing page stating, "Alcohol purchases require an age of 21 or older." If the customer is 21 or older, the purchase will be processed, and an order number will be generated.
     
  3. Three-Day Return Policy
     
     Customers may only return an item within three days of its purchase date. After this period, they will no longer be allowed to request a return. A trigger will check whether the item's purchase date exceeds the three-day return window. If it does, a pop-up message will appear stating, "The 3-day return window has passed," and the return request will be rejected. If the request is within the three-day window, it will be processed and sent to a manager for approval or rejection.

#### Types of Queries/Reports Available in the Application

The application contains three main reports that managers can access to retrieve summaries and detailed information from the database.
  1. Employee Report:
     
     Using specified parameters, the report will provide summary data showing the total number of employees hired, the total number of hours all employees are scheduled to work within the specified time frame, and the estimated wages all employees will earn during that period. The employee records used to generate this report will be displayed at the bottom of the screen, including employeeID, name, role, hire date, pay rate, and weekly schedule.

  3. Customer Loyalty Report:
     
     Using a specified time frame within its parameters, the report will provide summary data showing the number of orders that used loyalty points, the number of orders that did not use points, the total amount saved using points, the total number of points redeemed, and the average number of points used per order. All orders used to generate the report will be displayed at the bottom of the screen, including the order number, customer, fulfillment status, order total, points used, and receipt. Within the receipt, the manager can select "View Order" to see the transaction breakdown, including the original total and the amount deducted using loyalty points.
 
  4. Sales Performance Report:

     Using specified parameters, the report will provide summary data showing total sales revenue, number of transactions, average transaction value, the top five sales days, and merchandise sales by category. All transactions used to generate the summary data will be displayed at the bottom of the page, including orderID, customer, transaction date, order total, and receipt. The receipt will include an option to view the order, showing each item purchased, loyalty points used and earned, and the total transaction price.


#### How to Run:

From the repository root:

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).
This runs the React frontend and Express backend together. Ctrl+C stops both.
Vite forwards `/api` requests to the backend on port 3000.

- `frontend/`: React app,`.
- `backend/`: MySQL API.
- `db/`: schema and seed SQL.

The backend loads `backend/.env` regardless of the working directory.
Supply `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` when ready.

The SQL scripts use the database name `grocery_store`.
Database features require MySQL with the corresponding schema/data.
`GET /api/health` checks the API without accessing MySQL.


This is how you run locally on your machine the frontend and backend.
However you are still connected to the database. So any imports/updates/modify
still modify the database.

Have 2 terminals open

1. cd into frontend folder
2. npm install (to make sure you have the dependencies installed on your local machine)
3. npm run dev

4. cd into backend folder
5. npm install
6. npm start


