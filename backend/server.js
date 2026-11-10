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
import uploadProductImageRoutes from "./routes/products/uploadProductImage.js";
import deleteProductRoutes from "./routes/products/deleteProducts.js";
import restockProductRoutes from "./routes/products/restockProduct.js";
import restoreProductRoute from "./routes/products/restoreProducts.js";
import salesPerformanceRoutes from "./routes/reports/salesPerformance.js";
import createCartRoutes from "./routes/cart/cart.js";
import pool from "./db.js";
import loyaltyReportRoutes from "./routes/reports/loyaltyReports.js";
import inventoryReportRoutes from "./routes/reports/inventoryReports.js";
import managePromotionRoutes from "./routes/promotions/managePromotions.js";
import employeeWorkloadRoutes from "./routes/reports/employeeWorkload.js";
import requireManager from "./routes/auth/requireManager.js";
import restockRequestRoutes from "./routes/employees/restockRequests.js";
import managerRestockRequestRoutes from "./routes/employees/managerRestockRequests.js";
const app = express();

app.use(express.json());
app.use("/api/manager", requireManager);
app.use("/api/reports", (req, res, next) => {
  // The stock endpoint checks staff authentication in its own router.
  if (
    ["GET", "HEAD"].includes(req.method) &&
    ["/inventory/stock", "/inventory/stock/"].includes(req.path)
  ) {
    return next();
  }

  return requireManager(req, res, next);
});
app.use("/api/employees/unassigned", requireManager);
app.use("/api/returns", requireManager);
app.get("/api/manager/session", (req, res) => {
  res.json({ employee: req.employee });
});
app.use("/api/manager/reports/employee-workload", employeeWorkloadRoutes);
app.use("/api/manager/promotions", managePromotionRoutes);
app.use("/api/employees", employeeLoginRoutes);
app.use("/api/employee/fulfillment", employeeFulfillmentRoutes);
app.use("/api/employee/restock-requests", restockRequestRoutes);
app.use("/api/manager/restock-requests", managerRestockRequestRoutes);
//add
app.use("/api/returns", returnRoutes);
app.use("/api/manager/orders", manageOrderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/manager/products", productRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireManager(req, res, next);
});
app.use("/api/products", restockProductRoutes);
app.use("/api/products", saveProductRoutes);
app.use("/api/products", editProductRoutes);
app.use("/api/products", uploadProductImageRoutes);
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

// API requests must receive JSON even when an older or incorrect URL is used.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found. Restart the backend if it was recently updated." });
});

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
