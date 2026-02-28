const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Ensure Auth
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

// Customer routes
router.post('/orders', ensureAuthenticated, orderController.create);
router.get('/orders/:id', ensureAuthenticated, orderController.detail);
router.post('/orders/:id/cancel', ensureAuthenticated, orderController.cancel);
router.post('/orders/items/:id/cancel', ensureAuthenticated, orderController.cancelItem);
router.post('/orders/items/:id/complete', ensureAuthenticated, orderController.completeItem);

// Seller routes
router.post('/orders/items/:id/accept', ensureSeller, orderController.sellerProcess);
router.post('/orders/items/:id/ship', ensureSeller, orderController.sellerShip);
router.post('/orders/items/:id/ship', ensureSeller, orderController.sellerShip);
router.post('/orders/items/:id/reject', ensureSeller, orderController.sellerReject);
router.get('/orders/seller/:id', ensureSeller, orderController.sellerDetail);

router.post('/orders/:id/hide', ensureAuthenticated, orderController.hideHistory);
router.post('/orders/items/:id/hide', ensureSeller, orderController.hideSellerHistory);

// Admin Routes (ensureAdmin middleware duplication needed or import from dashboard.js logic)
// Since this file lacks ensureAdmin, I'll add it momentarily or assume ensureSeller is enough for now? 
// No, Admin is different. Let's add ensureAdmin here.
const ensureAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', req.t('route.admin_only'));
    res.redirect('/login');
};
router.post('/admin/orders/:id/delete', ensureAdmin, orderController.adminDelete);

module.exports = router;
