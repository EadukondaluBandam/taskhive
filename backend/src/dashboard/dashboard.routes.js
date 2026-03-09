const express = require("express");
const controller = require("./dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/roles");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get("/summary", asyncHandler(controller.getSummary));
router.get("/activity-insights", asyncHandler(controller.getActivityInsights));
router.get("/organization-summary", asyncHandler(controller.getOrganizationSummary));
router.get("/tracked-time", asyncHandler(controller.getTrackedTime));
router.get("/productivity-overview", asyncHandler(controller.getProductivityOverview));
router.get("/monitoring-snapshot", asyncHandler(controller.getMonitoringSnapshot));

module.exports = router;
