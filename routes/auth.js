const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.loginPage);
router.post('/auth/login', authController.login);
router.get('/register', authController.registerPage);
router.post('/auth/register', authController.register);
router.get('/logout', authController.logout);

router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/reset-password/:token', authController.resetPasswordPage);
router.post('/auth/reset-password/:token', authController.resetPassword);

module.exports = router;
