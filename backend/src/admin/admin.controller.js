const { StatusCodes } = require("http-status-codes");
const service = require("./admin.service");

const listEmployees = async (req, res) => {
  const data = await service.getEmployees(req.user);
  res.status(StatusCodes.OK).json({ success: true, data });
};

const createEmployee = async (req, res) => {
  const data = await service.createEmployee(req.validated.body, req.user);
  res.status(StatusCodes.CREATED).json({ success: true, data });
};

const deleteEmployee = async (req, res) => {
  await service.deleteEmployee(req.params.id, req.user);
  res.status(StatusCodes.OK).json({ success: true, message: "Employee deleted successfully" });
};

module.exports = {
  listEmployees,
  createEmployee,
  deleteEmployee
};
