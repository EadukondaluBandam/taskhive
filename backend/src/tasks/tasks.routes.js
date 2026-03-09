const express = require("express");
const controller = require("./tasks.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { createTaskSchema } = require("./tasks.schema");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);
router.get("/", asyncHandler(controller.listTasks));
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createTaskSchema), asyncHandler(controller.createTask));

module.exports = router;
