const { StatusCodes } = require("http-status-codes");
const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/ApiError");

const ACCESS_COOKIE = "taskhive_access_token";

const extractBearerToken = (header = "") => {
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const resolveAccessToken = (req) =>
  extractBearerToken(req.headers.authorization) || req.cookies?.[ACCESS_COOKIE] || null;

const verifyJwt = (req, res, next) => {
  const token = resolveAccessToken(req);
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Unauthorized",
      data: null
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (_err) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
};

const optionalVerifyJwt = (req, _res, next) => {
  const token = resolveAccessToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch (_err) {
    req.user = null;
  }

  next();
};

module.exports = {
  verifyJwt,
  optionalVerifyJwt,
  authenticate: verifyJwt,
  optionalAuthenticate: optionalVerifyJwt
};
