import express from 'express';
import cors from 'cors';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import loyaltyRoutes from './routes/loyalty.js';
import healthRoutes from './routes/health.js';
import couponRoutes from './routes/coupons.js';
import seasonalSalesRoutes from './routes/seasonalSales.js';
import categoriesRoutes from './routes/categories.js'

import employeeRoutes from './routes/unassignedEmployees.js'
import manageOrderRoutes from './routes/manageOrders.js'
import loyaltyReportRoutes from './routes/loyaltyReports.js';
import inventoryReportRoutes from './routes/inventoryReports.js';
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/manager/orders', manageOrderRoutes)
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/employees/unassigned', employeeRoutes)
app.use('/', healthRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/seasonal-sales', seasonalSalesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports/loyalty', loyaltyReportRoutes);
app.use('/api/reports/inventory', inventoryReportRoutes);

app.use((error, req, res, next) => {
    console.error('API request failed:', error.message);
    res.status(500).json({ message: 'Unable to complete the request. Check the database connection.' });
});

app.listen(3000, () => {
    console.log('FreshMart server is running on port 3000');
});
