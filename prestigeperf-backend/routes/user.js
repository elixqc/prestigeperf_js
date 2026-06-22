const express = require('express');
const router = express.Router();
const upload = require('../utils/multer'); 
const { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    updateUserRole, 
    deactivateUser, 
    restoreUser, 
    logoutUser, 
    getProfile, 
    updateProfile,
    checkUsername,
    checkEmail
} = require('../controllers/user');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/check-username/:username', checkUsername);
router.get('/check-email/:email', checkEmail);
router.get('/users', isAuthenticatedUser, isAdmin, getAllUsers);
router.put('/users/:id/role', isAuthenticatedUser, isAdmin, updateUserRole);
router.delete('/users/:id/deactivate', isAuthenticatedUser, isAdmin, deactivateUser);
router.put('/users/:id/restore', isAuthenticatedUser, isAdmin, restoreUser);
router.post('/logout', isAuthenticatedUser, logoutUser);
router.get('/profile', isAuthenticatedUser, getProfile);
router.post('/profile/update', isAuthenticatedUser, upload.single('profile_picture'), updateProfile);

module.exports = router;