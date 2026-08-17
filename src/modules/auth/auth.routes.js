const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./auth.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { registerRules, loginRules, forgotPasswordRules } = require("./auth.validation");

// Tighter limit on auth endpoints specifically — these are the most
// attractive target for brute-forcing, independent of the global limiter.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/register", authLimiter, registerRules, validate, controller.register);
router.post("/login", authLimiter, loginRules, validate, controller.login);
router.post("/logout", authenticate, controller.logout);
router.post("/forgot-password", authLimiter, forgotPasswordRules, validate, controller.forgotPassword);
router.get("/me", authenticate, controller.me);
router.put("/me", authenticate, controller.updateMe);

module.exports = router;
