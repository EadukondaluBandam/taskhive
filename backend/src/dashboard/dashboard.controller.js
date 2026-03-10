const { StatusCodes } = require("http-status-codes");
const service = require("./dashboard.service");

const getAdminDashboard = async (req, res) => {
  const data = await service.getAdminDashboard(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getSuperadminDashboard = async (_req, res) => {
  const data = await service.getSuperadminDashboard();
  res.status(StatusCodes.OK).json({ success: true, data });
};

module.exports = {
  getAdminDashboard,
  getSuperadminDashboard
};
