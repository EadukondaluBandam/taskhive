const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service");
const { env } = require("../config/env");
const logger = require("../utils/logger");

const REFRESH_COOKIE = "taskhive_refresh_token";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, {
    ...refreshCookieOptions,
    maxAge: undefined
  });
};

const register = async (req, res) => {
  const result = await authService.register(req.validated.body, req.user || null);
  setRefreshCookie(res, result.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
};

const registerCompany = async (req, res) => {
  const result = await authService.registerCompany(req.validated.body);
  setRefreshCookie(res, result.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company admin registered successfully",
    data: {
      user: result.user,
      organization: result.organization,
      defaults: result.defaults,
      accessToken: result.accessToken
    }
  });
};

const login = async (req, res) => {
  const result = await authService.login(req.validated.body);
  setRefreshCookie(res, result.refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
    data: {}
  });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password has been reset successfully",
    data: {}
  });
};

const setPassword = async (req, res) => {
  await authService.setPassword(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password set successfully",
    data: {}
  });
};

const refresh = async (req, res) => {
  const refreshToken = req.validated.body.refreshToken || req.cookies[REFRESH_COOKIE];
  const result = await authService.refresh({ refreshToken });
  setRefreshCookie(res, result.refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Access token refreshed successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
};

const logout = async (req, res) => {
  const refreshToken = req.validated.body.refreshToken || req.cookies[REFRESH_COOKIE];
  await authService.logout({ refreshToken });
  clearRefreshCookie(res);
  logger.info("User logged out", { ip: req.ip });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logout successful",
    data: {}
  });
};

module.exports = {
  register,
  registerCompany,
  login,
  forgotPassword,
  resetPassword,
  setPassword,
  refresh,
  logout
};
