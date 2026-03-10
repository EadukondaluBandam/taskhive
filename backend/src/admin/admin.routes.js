const express = require("express");
const controller = require("./admin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");
const { validate } = require("../middleware/validate.middleware");
const { createEmployeeSchema, updateEmployeeSchema, idParamSchema } = require("./admin.schema");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/employees", asyncHandler(controller.listEmployees));
router.post("/employees", validate(createEmployeeSchema), asyncHandler(controller.createEmployee));
router.put("/employees/:id", validate(updateEmployeeSchema), asyncHandler(controller.updateEmployee));
router.delete("/employees/:id", validate(idParamSchema), asyncHandler(controller.deleteEmployee));

module.exports = router;
