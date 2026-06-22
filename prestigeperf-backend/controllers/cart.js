const { Cart, Product, ProductImage } = require('../models');

// Get current user's cart
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findAll({
            where: { user_id: req.user.user_id },
            include: [{
                model: Product,
                attributes: ['product_name', 'selling_price', 'stock_quantity'],
                include: [{ model: ProductImage, attributes: ['image_path'] }]
            }]
        });
        res.json({ success: true, cart });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add item (or increase quantity if already in cart)
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const user_id = req.user.user_id;

        const existing = await Cart.findOne({ where: { user_id, product_id } });

        if (existing) {
            existing.quantity += (quantity || 1);
            await existing.save();
        } else {
            await Cart.create({ user_id, product_id, quantity: quantity || 1 });
        }

        res.status(201).json({ success: true, message: 'Added to cart' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update quantity for a specific product
exports.updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const user_id = req.user.user_id;
        const product_id = req.params.productId;

        await Cart.update({ quantity }, { where: { user_id, product_id } });
        res.json({ success: true, message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Remove single item
exports.removeCartItem = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const product_id = req.params.productId;

        await Cart.destroy({ where: { user_id, product_id } });
        res.json({ success: true, message: 'Item removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Clear entire cart (used after checkout)
exports.clearCart = async (req, res) => {
    try {
        await Cart.destroy({ where: { user_id: req.user.user_id } });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Merge guest cart (from frontend sessionStorage) to DB cart after login
exports.mergeCart = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { items } = req.body; // array of { product_id, quantity }

        for (const item of items) {
            const existing = await Cart.findOne({
                where: { user_id, product_id: item.product_id }
            });

            if (existing) {
                existing.quantity += item.quantity;
                await existing.save();
            } else {
                await Cart.create({
                    user_id,
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }
        }

        res.json({ success: true, message: 'Cart merged successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};