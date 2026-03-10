const express = require("express");
const controller = require("./superadmin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { role } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");
const { validate } = require("../middleware/validate.middleware");
const { idSchema } = require("./superadmin.schema");

const router = express.Router();

router.use(authenticate);
router.use(role([ROLES.SUPERADMIN]));

router.get("/companies", asyncHandler(controller.listCompanies));
router.get("/admins", asyncHandler(controller.listAdmins));
router.get("/employees", asyncHandler(controller.listEmployees));
router.delete("/admin/:id", validate(idSchema), asyncHandler(controller.deleteAdmin));
router.delete("/user/:id", validate(idSchema), asyncHandler(controller.deleteUser));

module.exports = router;
