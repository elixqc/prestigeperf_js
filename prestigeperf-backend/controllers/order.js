const { Order, OrderDetail, Product, User, Cart, ProductImage } = require('../models');
const { sendOrderStatusEmail } = require('../utils/mailer');;


exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['username', 'email', 'address', 'contact_number'] },
                {
                    model: OrderDetail,
                    include: [{
                        model: Product,
                        attributes: ['product_name', 'selling_price'],
                        include: [{ model: ProductImage, attributes: ['image_path'] }]
                    }]
                }
            ]
        });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.user_id },
            include: [
                { model: User, attributes: ['username', 'address', 'contact_number'] },
                {
                    model: OrderDetail,
                    include: [{
                        model: Product,
                        attributes: ['product_name', 'selling_price'],
                        include: [{ model: ProductImage, attributes: ['image_path'] }]
                    }]
                }
            ]
        });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createOrder = async (req, res) => {
    const t = await Order.sequelize.transaction();
    try {
        const { payment_method, payment_reference } = req.body;
        const user_id = req.user.user_id;

        const cartItems = await Cart.findAll({
            where: { user_id },
            transaction: t
        });

        if (cartItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const order = await Order.create({
            user_id,
            payment_method,
            payment_reference: payment_method === 'COD' ? null : payment_reference
        }, { transaction: t });

        for (const item of cartItems) {
            const product = await Product.findByPk(item.product_id, { transaction: t });

            if (!product) {
                await t.rollback();
                return res.status(404).json({ success: false, message: `Product ${item.product_id} not found` });
            }

            if (product.stock_quantity < item.quantity) {
                await t.rollback();
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.product_name}` });
            }

            await OrderDetail.create({
                order_id: order.order_id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: product.selling_price
            }, { transaction: t });

            await Product.decrement('stock_quantity', {
                by: item.quantity,
                where: { product_id: item.product_id },
                transaction: t
            });
        }

        await Cart.destroy({ where: { user_id }, transaction: t });
        await t.commit();

        // Send confirmation email OUTSIDE transaction
        try {
            const fullOrder = await Order.findByPk(order.order_id, {
                include: [
                    { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
                ]
            });

            const user = await User.findByPk(user_id);
            await sendOrderStatusEmail(fullOrder, user, {
                subject: `Order #${order.order_id} Confirmed – Prestige Perfumery`
            });
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr.message);
        }

        res.status(201).json({ success: true, message: 'Order placed successfully', order });

    } catch (err) {
        try { await t.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr.message); }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const t = await Order.sequelize.transaction();
    try {
        const { order_status } = req.body;

        // If cancelling, restore stock first
        if (order_status === 'Cancelled') {
            const details = await OrderDetail.findAll({
                where: { order_id: req.params.id },
                transaction: t
            });

            for (const detail of details) {
                await Product.increment('stock_quantity', {
                    by: detail.quantity,
                    where: { product_id: detail.product_id },
                    transaction: t
                });
            }
        }

        await Order.update(
            { order_status },
            { where: { order_id: req.params.id }, transaction: t }
        );

        await t.commit();

        // Fetch AFTER commit so the status is the updated one
        try {
            const fullOrder = await Order.findByPk(req.params.id, {
                include: [
                    { model: User, attributes: ['username', 'email', 'address', 'contact_number'] },
                    { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
                ]
            });

            await sendOrderStatusEmail(fullOrder, fullOrder.User);
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr.message);
        }

        res.json({ success: true, message: 'Order status updated and email sent' });
    } catch (err) {
        try { await t.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr.message); }
        res.status(500).json({ success: false, message: err.message });
    }
};

// NEW: customer self-cancel — only their own order, only if still Pending
exports.cancelMyOrder = async (req, res) => {
    const t = await Order.sequelize.transaction();
    try {
        const order = await Order.findOne({
            where: { order_id: req.params.id, user_id: req.user.user_id },
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.order_status !== 'Pending') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }

        const details = await OrderDetail.findAll({
            where: { order_id: req.params.id },
            transaction: t
        });

        for (const detail of details) {
            await Product.increment('stock_quantity', {
                by: detail.quantity,
                where: { product_id: detail.product_id },
                transaction: t
            });
        }

        order.order_status = 'Cancelled';
        await order.save({ transaction: t });

        await t.commit();

        // Send status email OUTSIDE transaction, same pattern as updateOrderStatus
        try {
            const fullOrder = await Order.findByPk(order.order_id, {
                include: [
                    { model: User, attributes: ['username', 'email', 'address', 'contact_number'] },
                    { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
                ]
            });
            await sendOrderStatusEmail(fullOrder, fullOrder.User);
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr.message);
        }

        res.json({ success: true, message: 'Order cancelled and stock restored' });

    } catch (err) {
        try { await t.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr.message); }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteOrder = async (req, res) => {
    const t = await Order.sequelize.transaction();
    try {
        const details = await OrderDetail.findAll({
            where: { order_id: req.params.id },
            transaction: t
        });

        for (const detail of details) {
            await Product.increment('stock_quantity', {
                by: detail.quantity,
                where: { product_id: detail.product_id },
                transaction: t
            });
        }

        await OrderDetail.destroy({ where: { order_id: req.params.id }, transaction: t });
        await Order.destroy({ where: { order_id: req.params.id }, transaction: t });
        await t.commit();
        res.json({ success: true, message: 'Order deleted and stock restored' });
    } catch (err) {
        try { await t.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr.message); }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPaymentMethods = (req, res) => {
    const methods = ['COD', 'GCash'];
    res.json({ success: true, methods });
};

exports.getOrderStatuses = (req, res) => {
    const statuses = ['Pending', 'Processing', 'Out for Delivery', 'Completed', 'Cancelled'];
    res.json({ success: true, statuses });
};