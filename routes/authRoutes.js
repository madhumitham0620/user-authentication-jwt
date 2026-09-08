const express = require("express");

const {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
} = require("../controllers/authController");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post(
    "/register",
    register
);


// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    login
);


// ==========================================
// FORGOT PASSWORD
// ==========================================

router.post(
    "/forgot-password",
    forgotPassword
);


// ==========================================
// RESET PASSWORD
// ==========================================

router.post(
    "/reset-password/:token",
    resetPassword
);


// ==========================================
// LOGOUT
// ==========================================

router.post(
    "/logout",
    logout
);


module.exports = router;