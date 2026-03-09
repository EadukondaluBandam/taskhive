const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { env } = require("./env");

const parseAllowedOrigins = (origins) => {
  if (!origins || origins === "*") return true;
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const explicitOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

const securityMiddleware = [
  helmet(),
  cors({
    origin: (origin, callback) => {
      // Non-browser requests (curl/postman/server-to-server) have no Origin header.
      if (!origin) return callback(null, true);

      if (explicitOrigins === true) return callback(null, true);
      if (Array.isArray(explicitOrigins) && explicitOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
];

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later"
  }
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later"
  }
});

module.exports = {
  securityMiddleware,
  globalRateLimiter,
  authRateLimiter
};
