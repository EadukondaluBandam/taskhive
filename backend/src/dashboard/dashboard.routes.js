const express = require("express");
const controller = require("./dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { role } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);

router.get("/admin", role([ROLES.ADMIN]), asyncHandler(controller.getAdminDashboard));
router.get("/superadmin", role([ROLES.SUPERADMIN]), asyncHandler(controller.getSuperadminDashboard));

module.exports = router;
