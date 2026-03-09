const { StatusCodes } = require("http-status-codes");
const service = require("./timeEntries.service");
const { parseCursorPagination } = require("../utils/pagination");

const createTimeEntry = async (req, res) => {
  const entry = await service.createTimeEntry(req.validated.body, req.user);
  res.status(StatusCodes.CREATED).json({ success: true, data: entry });
};

const listTimeEntries = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listTimeEntries(req.user, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

module.exports = {
  createTimeEntry,
  listTimeEntries
};
