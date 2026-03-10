const { StatusCodes } = require("http-status-codes");
const service = require("./superadmin.service");

const listCompanies = async (_req, res) => {
  const data = await service.listCompanies();
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
  await service.deleteAdmin(req.validated.params.id);
  res.status(StatusCodes.OK).json({ success: true, data: {} });
};

const deleteUser = async (req, res) => {
  await service.deleteUser(req.validated.params.id);
  res.status(StatusCodes.OK).json({ success: true, data: {} });
};

module.exports = {
  listCompanies,
  listAdmins,
  listEmployees,
  deleteAdmin,
  deleteUser
};
