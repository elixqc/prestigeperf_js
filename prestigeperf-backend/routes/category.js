const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory, restoreCategory } = require('../controllers/category');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/categories', getAllCategories);
router.post('/categories', isAuthenticatedUser, isAdmin, createCategory);
router.put('/categories/:id', isAuthenticatedUser, isAdmin, updateCategory);
router.delete('/categories/:id', isAuthenticatedUser, isAdmin, deleteCategory);
router.put('/categories/:id/restore', isAuthenticatedUser, isAdmin, restoreCategory);

module.exports = router;