const express = require("express");
const authRoutes = require("../auth/auth.routes");
const usersRoutes = require("../users/users.routes");
const organizationsRoutes = require("../organizations/organizations.routes");
const projectsRoutes = require("../projects/projects.routes");
const tasksRoutes = require("../tasks/tasks.routes");
const timeEntriesRoutes = require("../timeEntries/timeEntries.routes");
const activitiesRoutes = require("../activities/activities.routes");
const notificationsRoutes = require("../notifications/notifications.routes");
const dashboardRoutes = require("../dashboard/dashboard.routes");
const invitationsRoutes = require("../invitations/invitations.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "TaskHive API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/projects", projectsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/time-entries", timeEntriesRoutes);
router.use("/activities", activitiesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/invitations", invitationsRoutes);

module.exports = router;
