const { Supplier } = require('../models');

exports.getAllSuppliers = async (req, res) => {
    try {
        const showDisabled = req.query.show_disabled === 'true';

        const suppliers = await Supplier.findAll(
            showDisabled
                ? { where: { is_active: 0, deleted_at: { [require('sequelize').Op.ne]: null } } }
                : { where: { is_active: 1, deleted_at: null } }
        );
        res.json({ success: true, suppliers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const { supplier_name, contact_person, contact_number, address } = req.body;
        const supplier = await Supplier.create({ supplier_name, contact_person, contact_number, address });
        res.status(201).json({ success: true, message: 'Supplier created', supplier });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const { supplier_name, contact_person, contact_number, address } = req.body;
        await Supplier.update({ supplier_name, contact_person, contact_number, address }, { where: { supplier_id: req.params.id } });
        res.json({ success: true, message: 'Supplier updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        await Supplier.update({ is_active: 0, deleted_at: new Date() }, { where: { supplier_id: req.params.id } });
        res.json({ success: true, message: 'Supplier deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.restoreSupplier = async (req, res) => {
    try {
        await Supplier.update({ is_active: 1, deleted_at: null }, { where: { supplier_id: req.params.id } });
        res.json({ success: true, message: 'Supplier restored' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};