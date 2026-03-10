const express = require("express");
const controller = require("./superadmin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");
const { validate } = require("../middleware/validate.middleware");
const { idParamSchema, createAdminSchema, createEmployeeSchema } = require("./superadmin.schema");

const router = express.Router();

router.use(authenticate);
router.use(requireRole(ROLES.SUPER_ADMIN));

router.get("/dashboard", asyncHandler(controller.getDashboard));
router.get("/admins", asyncHandler(controller.listAdmins));
router.post("/admins", validate(createAdminSchema), asyncHandler(controller.createAdmin));
router.delete("/admins/:id", validate(idParamSchema), asyncHandler(controller.deleteAdmin));

router.get("/employees", asyncHandler(controller.listEmployees));
router.post("/employees", validate(createEmployeeSchema), asyncHandler(controller.createEmployee));
router.delete("/employees/:id", validate(idParamSchema), asyncHandler(controller.deleteEmployee));

module.exports = router;
