const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service");

const register = async (req, res) => {
  const result = await authService.register(req.validated.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company registered successfully",
    data: result
  });
};

const login = async (req, res) => {
  const result = await authService.login(req.validated.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: result
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
    message: "Password created successfully",
    data: {}
  });
};

const refresh = async (req, res) => {
  const result = await authService.refresh(req.validated.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Access token refreshed successfully",
    data: result
  });
};

const logout = async (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logout successful",
    data: {}
  });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  setPassword,
  refresh,
  logout
};
