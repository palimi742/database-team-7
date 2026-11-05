import express from "express";
import employeeLoginRoutes from "./routes/auth/employeeLogin.js";
import employeeFulfillmentRoutes from "./routes/employees/employeeFulfillment.js";
//add
import returnRoutes from "./routes/returns.js";
import customerRoutes from "./routes/auth/customers.js";
import productRoutes from "./routes/products/products.js";
import loyaltyRoutes from "./routes/loyalty.js";
import healthRoutes from "./routes/health.js";
import couponRoutes from "./routes/promotions/coupons.js";
import seasonalSalesRoutes from "./routes/promotions/seasonalSales.js";
import employeeRoutes from "./routes/employees/unassignedEmployees.js";
import manageOrderRoutes from "./routes/employees/manageOrders.js";
import categoryRoutes from "./routes/products/categories.js";
import saveProductRoutes from "./routes/products/saveProduct.js";
import editProductRoutes from "./routes/products/editProduct.js";
import deleteProductRoutes from "./routes/products/deleteProducts.js";
import restoreProductRoute from "./routes/products/restoreProducts.js";
import salesPerformanceRoutes from "./routes/reports/salesPerformance.js";
import createCartRoutes from "./routes/cart/cart.js";
import pool from "./db.js";
import loyaltyReportRoutes from "./routes/reports/loyaltyReports.js";
import inventoryReportRoutes from "./routes/reports/inventoryReports.js";
import managePromotionRoutes from "./routes/promotions/managePromotions.js";
import employeeWorkloadRoutes from "./routes/reports/employeeWorkload.js";
import requireManager from "./routes/auth/requireManager.js";
const app = express();

app.use(express.json());
app.use("/api/manager", requireManager);
app.use("/api/reports", requireManager);
app.use("/api/employees/unassigned", requireManager);
app.use("/api/returns", requireManager);
app.get("/api/manager/session", (req, res) => {
  res.json({ employee: req.employee });
});
app.use("/api/manager/reports/employee-workload", employeeWorkloadRoutes);
app.use("/api/manager/promotions", managePromotionRoutes);
app.use("/api/employees", employeeLoginRoutes);
app.use("/api/employee/fulfillment", employeeFulfillmentRoutes);
//add
app.use("/api/returns", returnRoutes);
app.use("/api/manager/orders", manageOrderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireManager(req, res, next);
});
app.use("/api/products", saveProductRoutes);
app.use("/api/products", editProductRoutes);
app.use("/api/products", deleteProductRoutes);
app.use("/api/products", restoreProductRoute);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/employees/unassigned", employeeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/", healthRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/seasonal-sales", seasonalSalesRoutes);
app.use("/api/manager/reports/sales-performance", salesPerformanceRoutes);
app.use("/api/reports/loyalty", loyaltyReportRoutes);
app.use("/api/reports/inventory", inventoryReportRoutes);
app.use("/api", createCartRoutes(pool));

app.use((error, req, res, next) => {
  console.error("API request failed:", error.message);
  res.status(500).json({
    message: "Unable to complete the request. Check the database connection.",
  });
});

if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log("FreshMart server is running on port 3000");
  });
}

export default app;
