import express from "express";
import cors from "cors";
import employeeFulfillmentRoutes from "./routes/employeeFulfillment.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.use(
  "/api/employee/fulfillment",
  employeeFulfillmentRoutes
);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Employee fulfillment server running on port ${PORT}`);
});
