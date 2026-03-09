const express = require("express");
const controller = require("./invitations.controller");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { authRateLimiter } = require("../config/security");
const { ROLES } = require("../utils/roles");
const { sendInvitationSchema, acceptInvitationSchema } = require("./invitations.schema");

const router = express.Router();

router.post(
  "/send",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  authRateLimiter,
  validate(sendInvitationSchema),
  asyncHandler(controller.sendInvitation)
);

router.post("/accept", authRateLimiter, validate(acceptInvitationSchema), asyncHandler(controller.acceptInvitation));

module.exports = router;
