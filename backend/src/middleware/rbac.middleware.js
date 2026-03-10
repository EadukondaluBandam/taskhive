const { StatusCodes } = require("http-status-codes");
const { ApiError } = require("../utils/ApiError");

const role = (allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Forbidden"));
  }

  return next();
};

const requireRole = (requiredRole) => role([requiredRole]);
const authorize = (...allowedRoles) => role(allowedRoles);

module.exports = {
  role,
  requireRole,
  authorize
};
