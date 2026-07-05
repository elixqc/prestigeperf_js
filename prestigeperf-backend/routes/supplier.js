const express = require('express');
const router = express.Router();
const { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, restoreSupplier } = require('../controllers/supplier');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/suppliers', getAllSuppliers);
router.post('/suppliers', isAuthenticatedUser, isAdmin, createSupplier);
router.put('/suppliers/:id', isAuthenticatedUser, isAdmin, updateSupplier);
router.delete('/suppliers/:id', isAuthenticatedUser, isAdmin, deleteSupplier);
router.put('/suppliers/:id/restore', isAuthenticatedUser, isAdmin, restoreSupplier);

module.exports = router;