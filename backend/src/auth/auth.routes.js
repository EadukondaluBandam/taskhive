const express = require("express");
const controller = require("./auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { optionalAuthenticate } = require("../middleware/auth.middleware");
const { canAssignRole } = require("../middleware/rbac.middleware");
const { authRateLimiter } = require("../config/security");
const {
  registerSchema,
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setPasswordSchema,
  refreshSchema,
  logoutSchema
} = require("./auth.schema");

const router = express.Router();

router.post("/register", optionalAuthenticate, validate(registerSchema), canAssignRole("role"), asyncHandler(controller.register));
router.post("/register-company", authRateLimiter, validate(registerCompanySchema), asyncHandler(controller.registerCompany));
router.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.post("/set-password", authRateLimiter, validate(setPasswordSchema), asyncHandler(controller.setPassword));
router.post("/refresh", authRateLimiter, validate(refreshSchema), asyncHandler(controller.refresh));
router.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));

module.exports = router;
