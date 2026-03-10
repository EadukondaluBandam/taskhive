const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const ACCESS_TTL = "7d";
const REFRESH_TTL = "30d";

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TTL });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, env.REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
