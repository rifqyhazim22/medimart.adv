const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');
const dashboardRoutes = require('./dashboard');

router.use('/', authRoutes);
router.use('/', productRoutes);
router.use('/', orderRoutes);
router.use('/', cartRoutes);
router.use('/', dashboardRoutes);

const profileController = require('../controllers/profileController');
const upload = require('../middlewares/upload');

// ... existing routes ...

// Profile Routes
router.get('/profile', isAuthenticated, profileController.index);
router.post('/profile/edit', isAuthenticated, upload.fields([{ name: 'profile_image', maxCount: 1 }, { name: 'croppedAvatar', maxCount: 1 }]), profileController.editPost);
router.post('/profile/delete', isAuthenticated, profileController.deleteAccount);

module.exports = router;
