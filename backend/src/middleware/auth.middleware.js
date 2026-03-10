const { StatusCodes } = require("http-status-codes");
const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/ApiError");

const extractBearerToken = (header = "") => {
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const authenticate = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization || "");

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized"));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      companyId: decoded.companyId || null
    };
    return next();
  } catch (_error) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }
};

module.exports = {
  authenticate,
  verifyJwt: authenticate,
  optionalAuthenticate: (req, _res, next) => {
    const token = extractBearerToken(req.headers.authorization || "");
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        role: decoded.role,
        companyId: decoded.companyId || null
      };
    } catch (_error) {
      req.user = null;
    }

    return next();
  }
};
