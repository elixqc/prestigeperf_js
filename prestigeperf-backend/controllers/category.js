const { Category } = require('../models');

exports.getAllCategories = async (req, res) => {
    try {
        const showDisabled = req.query.show_disabled === 'true';

        const categories = await Category.findAll(
            showDisabled ? {} : { where: { deleted_at: null } }
        );
        res.json({ success: true, categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        const category = await Category.create({ category_name });
        res.status(201).json({ success: true, message: 'Category created', category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { category_name } = req.body;
        await Category.update({ category_name }, { where: { category_id: req.params.id } });
        res.json({ success: true, message: 'Category updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.update({ deleted_at: new Date() }, { where: { category_id: req.params.id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.restoreCategory = async (req, res) => {
    try {
        await Category.update({ deleted_at: null }, { where: { category_id: req.params.id } });
        res.json({ success: true, message: 'Category restored' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};