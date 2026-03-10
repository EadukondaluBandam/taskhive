const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service");

const registerCompany = async (req, res) => {
  const data = await authService.registerCompany(req.validated.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Company registered successfully",
    data
  });
};

const login = async (req, res) => {
  const data = await authService.login(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data
  });
};

const logout = async (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logout successful",
    data: {}
  });
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "If an account exists for that email, a reset link has been generated.",
    data: {}
  });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.validated.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password reset successful",
    data: {}
  });
};

module.exports = {
  registerCompany,
  login,
  logout,
  forgotPassword,
  resetPassword
};
