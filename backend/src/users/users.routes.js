const express = require("express");
const controller = require("./users.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { ROLES } = require("../utils/roles");
const { createUserSchema, deleteUserSchema } = require("./users.schema");

const router = express.Router();

router.use(authenticate);
router.get("/me", asyncHandler(controller.getMe));
router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createUserSchema),
  asyncHandler(controller.createUser)
);
router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(deleteUserSchema),
  asyncHandler(controller.deleteUser)
);
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), asyncHandler(controller.listUsers));

module.exports = router;
