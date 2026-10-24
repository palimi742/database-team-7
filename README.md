# Point of Sale (POS) - COSC 3380 Databases

## Team 7: Grocery Store System

From the repository root:

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).
This runs the React frontend and Express backend together. Ctrl+C stops both.
Vite forwards `/api` requests to the backend on port 3000.

- `frontend/`: React app.
- `backend/`: MySQL API.
- `db/`: schema and seed SQL.

The backend loads `backend/.env` regardless of the working directory.
Supply `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` when ready.
The SQL scripts use the database name `grocery_store`.
Database features require MySQL with the corresponding schema/data.
`GET /api/health` checks the API without accessing MySQL.

Use `npm run dev:frontend` or `npm run dev:backend` to run either separately.
Use `npm run build` to build the frontend.

Employee sign-in uses `POST /api/employees/login` and supports active Manager and
Delivery accounts from the existing Employee and EmployeeAccounts tables.
Managers open `/manager`; delivery staff open `/deliveries`. Both workspace pages
are placeholders; inventory management and delivery assignments are not implemented.
Employee login follows the existing schema's plain-text password comparison;
it does not issue a server session or token. The page role checks only control navigation.
Transactions are a placeholder. The cart is local page state; checkout does not
have a backend endpoint yet.

Frontend pages live in `frontend/src/pages/`, shared components in
`frontend/src/components/`, and styles in `frontend/src/css/`. Backend endpoints
live in `backend/routes/` and are registered in `backend/server.js`.
The FreshMart client and server have been consolidated into these folders.
