const express = require('express');
const router = express.Router();
console.log("-> Dashboard route di-reload!");
const dashboardController = require('../controllers/dashboardController');

// Middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error_msg', req.t('route.login_required'));
    res.redirect('/login');
};

const ensureSeller = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'seller') {
        return next();
    }
    req.flash('error', req.t('route.seller_only'));
    res.redirect('/');
};

const ensureAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', req.t('route.admin_only'));
    res.redirect('/login');
};

// Legacy redirect
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    if (req.session.user.role === 'seller') res.redirect('/seller/dashboard');
    else if (req.session.user.role === 'admin') res.redirect('/admin/dashboard');
    else res.redirect('/user/dashboard');
});

router.get('/user/dashboard', ensureAuthenticated, dashboardController.userDashboard);
router.get('/seller/dashboard', ensureSeller, dashboardController.sellerDashboard);
router.get('/seller/products', ensureSeller, dashboardController.sellerProducts);
router.get('/seller/orders', ensureSeller, dashboardController.sellerOrders);
router.get('/admin/dashboard', ensureAdmin, dashboardController.adminDashboard);

const userController = require('../controllers/userController');

// Seller Settings (Store Identity)
const upload = require('../middlewares/upload');
router.get('/seller/settings', ensureSeller, dashboardController.sellerSettings);
router.post('/seller/settings', ensureSeller, upload.single('store_banner'), dashboardController.sellerSettingsUpdate);

// Admin Actions
router.post('/admin/users/:id/delete', ensureAdmin, userController.delete);

module.exports = router;
