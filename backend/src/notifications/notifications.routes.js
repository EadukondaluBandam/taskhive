const express = require("express");
const controller = require("./notifications.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.use(authenticate);
router.get("/", asyncHandler(controller.listNotifications));

module.exports = router;
