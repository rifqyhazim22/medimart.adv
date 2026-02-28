const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Middleware
const redirectNonCustomers = (req, res, next) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
        if (req.session.user.role === 'seller') return res.redirect('/seller/dashboard');
    }
    next();
};

const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error_msg', req.t('route.login_required'));
    res.redirect('/login');
};

router.get('/cart', redirectNonCustomers, cartController.index);
router.post('/cart/add', cartController.add);
router.post('/cart/update', cartController.update);
router.post('/cart/remove', cartController.remove);
router.post('/cart/clear', cartController.clear);
router.get('/checkout', ensureAuthenticated, cartController.checkoutPage);

module.exports = router;
