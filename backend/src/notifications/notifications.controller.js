const { StatusCodes } = require("http-status-codes");
const service = require("./notifications.service");
const { parseCursorPagination } = require("../utils/pagination");

const listNotifications = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listNotifications(req.user.sub, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

module.exports = {
  listNotifications
};
