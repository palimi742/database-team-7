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

1. cd into backend folder
2. npm install
3. npm start

Employee sign-in and transactions are placeholders. The cart is local page state;
checkout does not have a backend endpoint yet.
