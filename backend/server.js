import express from 'express';
import cors from 'cors';
import employeeRoutes from './routes/employees.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import loyaltyRoutes from './routes/loyalty.js';
import healthRoutes from './routes/health.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/', healthRoutes);

app.use((error, req, res, next) => {
    console.error('API request failed:', error.message);
    res.status(500).json({ message: 'Unable to complete the request. Check the database connection.' });
});

app.listen(3000, () => {
    console.log('FreshMart server is running on port 3000');
});
