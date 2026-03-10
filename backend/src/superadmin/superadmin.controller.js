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

const createAdmin = async (req, res) => {
  const data = await service.createAdmin(req.validated.body);
  res.status(StatusCodes.CREATED).json({ success: true, data });
};

const listEmployees = async (_req, res) => {
  const data = await service.listEmployees();
  res.status(StatusCodes.OK).json({ success: true, data });
};

const createEmployee = async (req, res) => {
  const data = await service.createEmployee(req.validated.body);
  res.status(StatusCodes.CREATED).json({ success: true, data });
};

const deleteAdmin = async (req, res) => {
  await service.deleteAdmin(req.validated.params.id);
  res.status(StatusCodes.OK).json({ success: true, message: "Admin deleted successfully", data: {} });
};

const deleteEmployee = async (req, res) => {
  await service.deleteEmployee(req.validated.params.id);
  res.status(StatusCodes.OK).json({ success: true, message: "Employee deleted successfully", data: {} });
};

module.exports = {
  getDashboard,
  listAdmins,
  createAdmin,
  listEmployees,
  createEmployee,
  deleteAdmin,
  deleteEmployee
};
