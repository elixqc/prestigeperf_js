const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const supplierRoutes = require('./routes/supplier');
const orderRoutes = require('./routes/order');
const cartRoutes = require('./routes/cart');
const dashboardRoutes = require('./routes/dashboard');
const chatbotRoutes = require('./routes/chatbot');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/v1', userRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', supplierRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);

module.exports = app;