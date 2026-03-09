const { StatusCodes } = require("http-status-codes");
const service = require("./users.service");
const { parseCursorPagination } = require("../utils/pagination");

const listUsers = async (req, res) => {
  const pagination = parseCursorPagination(req.query);
  const data = await service.listUsers(req.user, pagination);
  res.status(StatusCodes.OK).json({ success: true, data: data.items, pageInfo: data.pageInfo });
};

const getMe = async (req, res) => {
  const user = await service.getMe(req.user.sub);
  res.status(StatusCodes.OK).json({ success: true, data: user });
};

module.exports = {
  listUsers,
  getMe
};
