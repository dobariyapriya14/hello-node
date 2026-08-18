// middlewares/rate.limiter.ts

import rateLimit from 'express-rate-limit';

// 🌍 Global limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests"
    }
});

// 🔐 Login limiter
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts"
    }
});

// 📱 OTP limiter
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many OTP requests"
    }
});

export {
    globalLimiter,
    loginLimiter,
    otpLimiter
};