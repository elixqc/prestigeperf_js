const express = require('express');
const router = express.Router();
const { getAllOrders, getMyOrders, createOrder, updateOrderStatus, getPaymentMethods, getOrderStatuses, cancelMyOrder } = require('../controllers/order');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/orders', isAuthenticatedUser, isAdmin, getAllOrders);
router.get('/my-orders', isAuthenticatedUser, getMyOrders);
router.post('/orders', isAuthenticatedUser, createOrder);
router.put('/orders/:id/status', isAuthenticatedUser, isAdmin, updateOrderStatus);
router.put('/orders/:id/cancel', isAuthenticatedUser, cancelMyOrder);
router.get('/payment-methods', getPaymentMethods);
router.get('/order-statuses', getOrderStatuses);

module.exports = router;