const { StatusCodes } = require("http-status-codes");
const service = require("./tasks.service");
const { parseCursorPagination } = require("../utils/pagination");

const createTask = async (req, res) => {
  const task = await service.createTask(req.validated.body);
  res.status(StatusCodes.CREATED).json({ success: true, data: task });
};

const listTasks = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listTasks(req.user, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

module.exports = {
  createTask,
  listTasks
};
