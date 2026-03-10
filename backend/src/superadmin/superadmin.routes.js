const express = require("express");
const controller = require("./superadmin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema } = require("./superadmin.schema");

const router = express.Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get("/dashboard", asyncHandler(controller.getDashboard));
router.get("/admins", asyncHandler(controller.listAdmins));
router.get("/employees", asyncHandler(controller.listEmployees));
router.delete("/admin/:id", validate(idParamSchema), asyncHandler(controller.deleteAdmin));
router.delete("/employee/:id", validate(idParamSchema), asyncHandler(controller.deleteEmployee));

module.exports = router;
