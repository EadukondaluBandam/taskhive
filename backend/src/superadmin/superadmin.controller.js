const { StatusCodes } = require("http-status-codes");
const service = require("./superadmin.service");

const getDashboard = async (_req, res) => {
  const data = await service.getDashboard();
  res.status(StatusCodes.OK).json({ success: true, data });
};

const listAdmins = async (_req, res) => {
  const data = await service.listAdmins();
  res.status(StatusCodes.OK).json({ success: true, data });
};

const listEmployees = async (_req, res) => {
  const data = await service.listEmployees();
  res.status(StatusCodes.OK).json({ success: true, data });
};

const deleteAdmin = async (req, res) => {
  await service.deleteAdmin(req.params.id);
  res.status(StatusCodes.OK).json({ success: true, message: "Admin deleted successfully" });
};

const deleteEmployee = async (req, res) => {
  await service.deleteEmployee(req.params.id);
  res.status(StatusCodes.OK).json({ success: true, message: "Employee deleted successfully" });
};

module.exports = {
  getDashboard,
  listAdmins,
  listEmployees,
  deleteAdmin,
  deleteEmployee
};
