const express = require("express");
const controller = require("./timeEntries.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { createTimeEntrySchema } = require("./timeEntries.schema");

const router = express.Router();

router.use(authenticate);
router.get("/", asyncHandler(controller.listTimeEntries));
router.post("/", validate(createTimeEntrySchema), asyncHandler(controller.createTimeEntry));

module.exports = router;
