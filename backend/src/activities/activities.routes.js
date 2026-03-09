const express = require("express");
const controller = require("./activities.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), asyncHandler(controller.listActivities));

module.exports = router;
