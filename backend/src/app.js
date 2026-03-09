const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { sendEmail } = require("./services/emailService");
const apiRoutes = require("./routes");
const authRoutes = require("./auth/auth.routes");
const { securityMiddleware, globalRateLimiter } = require("./config/security");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

securityMiddleware.forEach((mw) => app.use(mw));
app.use(globalRateLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "TaskHive API is healthy" });
});

app.get("/test-email", async (req, res) => {
  try {
    const to = req.query.to || process.env.SUPER_ADMIN_EMAIL;
    const response = await sendEmail(to, "TaskHive Email Test", "<h2>Email working successfully</h2>");
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email"
    });
  }
});

// Backward-compatible auth routes without version prefix.
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/api/v1", apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  require("./server");
}
