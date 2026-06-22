const { Product, Category, Order, OrderDetail, User } = require('../models');
const { Op } = require('sequelize');

// Helper — date filter
const getDateFilter = (period) => {
    const now = new Date();
    if (period === 'month') {
        return { order_date: { [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (period === 'year') {
        return { order_date: { [Op.gte]: new Date(now.getFullYear(), 0, 1) } };
    }
    return {};
};

// ─── Stats ────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const totalProducts = await Product.count({ where: { is_active: 1 } });
        const totalOrders = await Order.count();
        const totalUsers = await User.count({ where: { is_active: 1 } });
        const totalCategories = await Category.count({ where: { deleted_at: null } });

        res.json({ success: true, stats: { totalProducts, totalOrders, totalUsers, totalCategories } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Bar Chart — Stock per Product ───────────────────────────────────────────
exports.getBarChart = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { is_active: 1 },
            attributes: ['product_name', 'stock_quantity']
        });

        res.json({
            success: true,
            labels: products.map(p => p.product_name),
            data: products.map(p => p.stock_quantity)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Pie Chart — Top 5 Selling Products ──────────────────────────────────────
exports.getPieChart = async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        const dateFilter = getDateFilter(period);

        const topSelling = await OrderDetail.findAll({
            attributes: ['product_id'],
            include: [
                {
                    model: Order,
                    attributes: [],
                    where: Object.keys(dateFilter).length ? dateFilter : undefined,
                    required: true
                },
                {
                    model: Product,
                    attributes: ['product_name']
                }
            ],
            raw: true,
            nest: true
        });

        const productSales = {};
        topSelling.forEach(detail => {
            const name = detail.Product?.product_name ?? 'Unknown';
            productSales[name] = (productSales[name] || 0) + 1;
        });

        const sortedSales = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        res.json({
            success: true,
            period,
            labels: sortedSales.map(s => s[0]),
            data: sortedSales.map(s => s[1])
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Line Chart — Orders per Day ─────────────────────────────────────────────
exports.getLineChart = async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        const dateFilter = getDateFilter(period);

        const orders = await Order.findAll({
            where: Object.keys(dateFilter).length ? dateFilter : {},
            attributes: ['order_date']
        });

        const ordersByDate = {};
        orders.forEach(o => {
            const date = new Date(o.order_date).toLocaleDateString();
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        res.json({
            success: true,
            period,
            labels: Object.keys(ordersByDate),
            data: Object.values(ordersByDate)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── All Charts Combined (kept for backward compat) ──────────────────────────
exports.getChartData = async (req, res) => {
    try {
        const { period = 'all' } = req.query;
        const dateFilter = getDateFilter(period);

        const products = await Product.findAll({
            where: { is_active: 1 },
            attributes: ['product_name', 'stock_quantity']
        });

        const topSelling = await OrderDetail.findAll({
            attributes: ['product_id'],
            include: [
                {
                    model: Order,
                    attributes: [],
                    where: Object.keys(dateFilter).length ? dateFilter : undefined,
                    required: true
                },
                { model: Product, attributes: ['product_name'] }
            ],
            raw: true,
            nest: true
        });

        const productSales = {};
        topSelling.forEach(detail => {
            const name = detail.Product?.product_name ?? 'Unknown';
            productSales[name] = (productSales[name] || 0) + 1;
        });

        const sortedSales = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const orders = await Order.findAll({
            where: Object.keys(dateFilter).length ? dateFilter : {},
            attributes: ['order_date']
        });

        const ordersByDate = {};
        orders.forEach(o => {
            const date = new Date(o.order_date).toLocaleDateString();
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        const totalProducts = products.length;
        const totalOrders = await Order.count();
        const totalUsers = await User.count({ where: { is_active: 1 } });
        const totalCategories = await Category.count({ where: { deleted_at: null } });

        res.json({
            success: true,
            period,
            stats: { totalProducts, totalOrders, totalUsers, totalCategories },
            barChart: { labels: products.map(p => p.product_name), data: products.map(p => p.stock_quantity) },
            pieChart: { labels: sortedSales.map(s => s[0]), data: sortedSales.map(s => s[1]) },
            lineChart: { labels: Object.keys(ordersByDate), data: Object.values(ordersByDate) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};