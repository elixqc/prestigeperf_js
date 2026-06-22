const { Order, OrderDetail, Product, User, Cart } = require('../models');
const { transporter, generateReceiptPDF } = require('../utils/mailer');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['username', 'email', 'address', 'contact_number'] },
                { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
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
                { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
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

        // Send email OUTSIDE transaction
        try {
            const fullOrder = await Order.findByPk(order.order_id, {
                include: [
                    { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
                ]
            });

            const user = await User.findByPk(user_id);
            const pdfBuffer = await generateReceiptPDF(fullOrder, user);

            await transporter.sendMail({
                from: '"PrestigePerf" <noreply@prestigeperf.com>',
                to: user.email,
                subject: `Order #${order.order_id} Confirmation - PrestigePerf`,
                html: `
                    <h2>Thank you for your order, ${user.username}!</h2>
                    <p>Your order <strong>#${order.order_id}</strong> has been placed successfully.</p>
                    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                    ${order.payment_reference ? `<p><strong>Reference:</strong> ${order.payment_reference}</p>` : ''}
                    <p>Please find your receipt attached.</p>
                    <br>
                    <p>— PrestigePerf Team</p>
                `,
                attachments: [
                    {
                        filename: `receipt-order-${order.order_id}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
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

        // Send email OUTSIDE transaction
        try {
            const fullOrder = await Order.findByPk(req.params.id, {
                include: [
                    { model: User, attributes: ['username', 'email', 'address', 'contact_number'] },
                    { model: OrderDetail, include: [{ model: Product, attributes: ['product_name', 'selling_price'] }] }
                ]
            });

            const pdfBuffer = await generateReceiptPDF(fullOrder, fullOrder.User);

            await transporter.sendMail({
                from: '"PrestigePerf" <noreply@prestigeperf.com>',
                to: fullOrder.User.email,
                subject: `Order #${fullOrder.order_id} Status Update - PrestigePerf`,
                html: `
                    <h2>Order Status Update</h2>
                    <p>Hi ${fullOrder.User.username},</p>
                    <p>Your order <strong>#${fullOrder.order_id}</strong> status has been updated to: <strong>${order_status}</strong></p>
                    <p>Please find your updated receipt attached.</p>
                    <br>
                    <p>— PrestigePerf Team</p>
                `,
                attachments: [
                    {
                        filename: `receipt-order-${fullOrder.order_id}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            });
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr.message);
        }

        await t.commit();
        res.json({ success: true, message: 'Order status updated and email sent' });
    } catch (err) {
        try { await t.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr.message); }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteOrder = async (req, res) => {
    const t = await Order.sequelize.transaction();
    try {
        // Add this before destroying
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