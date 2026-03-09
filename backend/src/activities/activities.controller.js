const { StatusCodes } = require("http-status-codes");
const service = require("./activities.service");
const { parseCursorPagination } = require("../utils/pagination");

const listActivities = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listActivities(req.user, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

module.exports = {
  listActivities
};
