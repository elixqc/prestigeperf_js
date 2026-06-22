const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart, mergeCart } = require('../controllers/cart');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.post('/cart/merge', isAuthenticatedUser, mergeCart); // ← pinataas!
router.get('/cart', isAuthenticatedUser, getCart);
router.post('/cart', isAuthenticatedUser, addToCart);
router.put('/cart/:productId', isAuthenticatedUser, updateCartItem);
router.delete('/cart/:productId', isAuthenticatedUser, removeCartItem);
router.delete('/cart', isAuthenticatedUser, clearCart);

module.exports = router;