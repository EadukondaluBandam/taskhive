const express = require("express");
const controller = require("./projects.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { createProjectSchema } = require("./projects.schema");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);
router.get("/", asyncHandler(controller.listProjects));
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validate(createProjectSchema), asyncHandler(controller.createProject));

module.exports = router;
