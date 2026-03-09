const express = require("express");
const controller = require("./organizations.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { createOrganizationSchema } = require("./organizations.schema");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize(ROLES.SUPER_ADMIN), asyncHandler(controller.listOrganizations));
router.post("/", authorize(ROLES.SUPER_ADMIN), validate(createOrganizationSchema), asyncHandler(controller.createOrganization));

module.exports = router;
