const { StatusCodes } = require("http-status-codes");
const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/ApiError");

const extractBearerToken = (header = "") => {
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const normalizeAuthUser = (payload) => {
  const id = payload.id || payload.sub;
  const companyId = payload.companyId ?? payload.organizationId ?? null;

  return {
    ...payload,
    id,
    sub: id,
    companyId,
    organizationId: companyId
  };
};

const resolveAccessToken = (req) => extractBearerToken(req.headers.authorization || "");

const authenticate = (req, res, next) => {
  const token = resolveAccessToken(req);

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Unauthorized",
      data: null
    });
  }

  try {
    req.user = normalizeAuthUser(verifyAccessToken(token));
    return next();
  } catch (_error) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
  }
};

const optionalAuthenticate = (req, _res, next) => {
  const token = resolveAccessToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = normalizeAuthUser(verifyAccessToken(token));
  } catch (_error) {
    req.user = null;
  }

  return next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  verifyJwt: authenticate,
  optionalVerifyJwt: optionalAuthenticate
};
