const { StatusCodes } = require("http-status-codes");
const service = require("./projects.service");
const { parseCursorPagination } = require("../utils/pagination");

const createProject = async (req, res) => {
  const project = await service.createProject(req.validated.body);
  res.status(StatusCodes.CREATED).json({ success: true, data: project });
};

const listProjects = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listProjects(req.user, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

module.exports = {
  createProject,
  listProjects
};
