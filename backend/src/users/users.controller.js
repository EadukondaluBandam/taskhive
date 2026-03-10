const { StatusCodes } = require("http-status-codes");
const service = require("./users.service");

const getMe = async (req, res) => {
  const user = await service.getMe(req.user.id);
  res.status(StatusCodes.OK).json({
    success: true,
    data: user
  });
};

module.exports = {
  getMe
};
