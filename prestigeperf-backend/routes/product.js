const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { getAllProducts, getSingleProduct, createProduct, updateProduct, deleteProduct, restoreProduct, deleteProductImage, getInactiveProducts } = require('../controllers/product');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/products', getAllProducts);
router.get('/products/inactive/list', isAuthenticatedUser, isAdmin, getInactiveProducts); // ← taas!
router.get('/products/:id', getSingleProduct); // ← baba!
router.post('/products', isAuthenticatedUser, isAdmin, upload.array('images', 10), createProduct);
router.put('/products/:id', isAuthenticatedUser, isAdmin, upload.array('images', 10), updateProduct);
router.put('/products/:id/restore', isAuthenticatedUser, isAdmin, restoreProduct);
router.delete('/products/:id', isAuthenticatedUser, isAdmin, deleteProduct);
router.delete('/products/:id/images/:imageId', isAuthenticatedUser, isAdmin, deleteProductImage);

module.exports = router;