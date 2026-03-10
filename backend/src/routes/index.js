const express = require("express");
const authRoutes = require("../auth/auth.routes");
const usersRoutes = require("../users/users.routes");
const adminRoutes = require("../admin/admin.routes");
const superadminRoutes = require("../superadmin/superadmin.routes");
const dashboardRoutes = require("../dashboard/dashboard.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "TaskHive API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);
router.use("/superadmin", superadminRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
