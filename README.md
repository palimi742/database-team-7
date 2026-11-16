# Freshmart (POS) - COSC 3380 Databases
# Team 7: Grocery Store System

## About
FreshMart, a database application used to manage customer purchases, employee dashboards, and manager operations. The system will allow customers to place orders by adding items to their cart, allowing for customer transactions and returns. Managers will be able to assign tasks to employees, add or edit products, confirm or reject returns, and view analytics. Additionally, the employee dashboard will allow employees to view inventory, request more stock when quantities are low, process assigned orders, and view their past order history. The purpose of Freshmart is to facilitate customer purchases and deliveries, maintain inventory stock, help managers monitor store analytics, and allow employees to complete customer orders quickly and efficiently.

## Technologies Used:
- **Frontend** — React and Vite
- **Backend** — Node.js
- **Database** — MySQL
- **Version Control** — Git and GitHub
- **Deployment** — Vercel hosts the web application and API. Azure Database for MySQL hosts the database.

## Submission Files
- frontend/ - React Web application
- backend/ - Node.js API and MySQL connection configuration.
- db/ - SQL scripts and Azure MySQL CA certificate.
- api/ and vercel.json - Vercel API entry point and deployment configuration for hosting.
- scripts - contains dev.mjs, to locally run the project
- package.json and package-lock.json - npm workspace dependencies

## Cloning the repo
git clone https://github.com/palimi742/database-team-7.git
## Running locally
The backend loads `backend/.env` regardless of the working directory.
Supply `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` when ready.

The backend uses the bundled certificate at `db/certs/azure-ca.pem` to verify its TLS connection to Azure MySQL. If you use your own MySQL server, adjust the `ssl` settings in `backend/db.js` to match your server’s TLS configuration.

From the directory where you cloned the repo, run the following commands.

```sh
cd database-team-7
npm ci
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`. The dev command starts both the frontend and backend.

Hosted URL: [Freshmart](https://database-team-7-theta.vercel.app/)

## User Roles
- **Customer** - Shops for products, places orders, and request returns on completed orders.
- **Manager** - Assigns orders to employees, manages products and coupons, reviews return and restock request, and views reports.
- **Employee** - Processes assigned orders, checks inventory, and submits restock request

## User Role Logins
Customer Login Info:
User can create their own account.
Live Account:
Username: cpalomo 
Password: palomo05!

Employee Login Info:
James Carter (employee)
Username: employee2
Password: employee764

Aisha Khan (employee)
Username: employee3
Password: employee583

Luis Ramirez (employee)
Username: employee4
Password: employee926

Manager Login Info:
Username: manager1
Password: manage01384
