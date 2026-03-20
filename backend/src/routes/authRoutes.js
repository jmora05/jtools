const express = require('express');
const router = express.Router();
const {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyCode,
    resendCode
} = require('../controllers/authController.js');

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);

module.exports = router; 