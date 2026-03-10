const express = require("express");
const controller = require("./admin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");
const { validate } = require("../middleware/validate.middleware");
const { createEmployeeSchema, idParamSchema } = require("./admin.schema");

const router = express.Router();

router.use(authenticate);
router.use(requireRole(ROLES.ADMIN));

router.post("/employee", validate(createEmployeeSchema), asyncHandler(controller.createEmployee));
router.get("/employees", asyncHandler(controller.listEmployees));
router.delete("/employee/:id", validate(idParamSchema), asyncHandler(controller.deleteEmployee));

module.exports = router;
