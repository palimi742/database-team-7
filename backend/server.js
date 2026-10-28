import express from "express";
import employeeLoginRoutes from "./routes/employeeLogin.js";
import employeeFulfillmentRoutes from "./routes/employeeFulfillment.js";
//add

import customerRoutes from "./routes/customers.js";
import productRoutes from "./routes/products.js";
import loyaltyRoutes from "./routes/loyalty.js";
import healthRoutes from "./routes/health.js";
import couponRoutes from "./routes/coupons.js";
import seasonalSalesRoutes from "./routes/seasonalSales.js";
import employeeRoutes from "./routes/unassignedEmployees.js";
import manageOrderRoutes from "./routes/manageOrders.js";
import categoryRoutes from "./routes/categories.js";
import saveProductRoutes from "./routes/saveProduct.js";
import editProductRoutes from "./routes/editProduct.js";
import deleteProductRoutes from "./routes/deleteProducts.js";
import restoreProductRoute from "./routes/restoreProducts.js";
import salesPerformanceRoutes from "./routes/salesPerformance.js";
import cartRoutes from "./routes/cart.js";

import loyaltyReportRoutes from "./routes/loyaltyReports.js";
import inventoryReportRoutes from "./routes/inventoryReports.js";
const app = express();

app.use(express.json());
app.use("/api/employees", employeeLoginRoutes);
app.use("/api/employee/fulfillment", employeeFulfillmentRoutes);
//add
app.use("/api/manager/orders", manageOrderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
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
app.use("/api/cart", cartRoutes);

app.use((error, req, res, next) => {
  console.error("API request failed:", error.message);
  res
    .status(500)
    .json({
      message: "Unable to complete the request. Check the database connection.",
    });
});

app.listen(3000, () => {
  console.log("FreshMart server is running on port 3000");
});
