const { StatusCodes } = require("http-status-codes");
const service = require("./dashboard.service");

const getSummary = async (req, res) => {
  const data = await service.getSummary(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getActivityInsights = async (req, res) => {
  const data = await service.getActivityInsights(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getOrganizationSummary = async (req, res) => {
  const data = await service.getOrganizationSummary(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getTrackedTime = async (req, res) => {
  const data = await service.getTrackedTime(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getProductivityOverview = async (req, res) => {
  const data = await service.getProductivityOverview(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const getMonitoringSnapshot = async (req, res) => {
  const data = await service.getMonitoringSnapshot(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

module.exports = {
  getSummary,
  getActivityInsights,
  getOrganizationSummary,
  getTrackedTime,
  getProductivityOverview,
  getMonitoringSnapshot
};
