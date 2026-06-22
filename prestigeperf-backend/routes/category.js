const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/category');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/categories', getAllCategories);
router.post('/categories', isAuthenticatedUser, isAdmin, createCategory);
router.put('/categories/:id', isAuthenticatedUser, isAdmin, updateCategory);
router.delete('/categories/:id', isAuthenticatedUser, isAdmin, deleteCategory);

module.exports = router;