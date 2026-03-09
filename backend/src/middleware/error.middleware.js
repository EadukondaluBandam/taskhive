const { StatusCodes } = require("http-status-codes");
const { ApiError } = require("../utils/ApiError");

const notFound = (req, _res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  if (err.code === "P2002") {
    statusCode = StatusCodes.CONFLICT;
    message = "Unique constraint violation";
  }

  const payload = {
    success: false,
    message,
    data: null
  };

  if (err instanceof ApiError && err.details) {
    payload.error = {
      details: err.details
    };
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFound,
  errorHandler
};
