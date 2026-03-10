const { StatusCodes } = require("http-status-codes");
const service = require("./admin.service");

const listEmployees = async (req, res) => {
  const data = await service.listEmployees(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const createEmployee = async (req, res) => {
  const data = await service.createEmployee(req.validated.body, req.user);
  res.status(StatusCodes.CREATED).json({ success: true, data });
};

const updateEmployee = async (req, res) => {
  const data = await service.updateEmployee(req.validated.params.id, req.validated.body, req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const deleteEmployee = async (req, res) => {
  await service.deleteEmployee(req.validated.params.id, req.user);
  res.status(StatusCodes.OK).json({ success: true, message: "Employee deleted successfully", data: {} });
};

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
