const express = require("express");
const controller = require("./users.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/me", authenticate, asyncHandler(controller.getMe));

module.exports = router;
