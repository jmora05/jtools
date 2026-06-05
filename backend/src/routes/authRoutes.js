const express  = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();
const {
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyCode,
    resendCode,
    changePassword,
} = require('../controllers/authController.js');
const { verifyToken } = require('../middleware/authMiddleware.js');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes de código. Intenta de nuevo en 15 minutos.' },
});

const resendLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Has alcanzado el límite de reenvíos. Intenta de nuevo en 30 minutos.' },
});

router.post('/login',                authLimiter, login);
router.post('/register',             authLimiter, register);
router.post('/logout',               logout);
router.post('/forgot-password',      otpLimiter,  forgotPassword);
router.post('/reset-password',                   resetPassword);
router.post('/verify-code',                     verifyCode);
router.post('/verify-reset-code',               verifyCode);
router.post('/resend-code',          resendLimiter, resendCode);
router.post('/resend-reset-code',    resendLimiter, resendCode);
router.post('/change-password',      verifyToken,   changePassword);

module.exports = router; 