const express = require("express");
const controller = require("./auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { authRateLimiter } = require("../config/security");
const {
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema
} = require("./auth.schema");

const router = express.Router();

router.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/register-company", authRateLimiter, validate(registerCompanySchema), asyncHandler(controller.registerCompany));
router.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));

module.exports = router;
