const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error_msg', 'Silakan login terlebih dahulu');
    res.redirect('/login');
};

const ensureSeller = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'seller') {
        return next();
    }
    req.flash('error', 'Akses khusus penjual.');
    res.redirect('/');
};

const ensureAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Akses khusus Admin.');
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
router.get('/admin/dashboard', ensureAdmin, dashboardController.adminDashboard);

const userController = require('../controllers/userController');

// Admin Actions
router.post('/admin/users/:id/delete', ensureAdmin, userController.delete);

module.exports = router;
