const express = require("express");
const controller = require("./auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { authRateLimiter } = require("../config/security");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
  refreshSchema,
  logoutSchema
} = require("./auth.schema");

const router = express.Router();

router.post("/register", authRateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post("/register-company", authRateLimiter, validate(registerSchema), asyncHandler(controller.register));
router.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.post("/set-password", authRateLimiter, validate(setPasswordSchema), asyncHandler(controller.setPassword));
router.post("/refresh", authRateLimiter, validate(refreshSchema), asyncHandler(controller.refresh));
router.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));

module.exports = router;
