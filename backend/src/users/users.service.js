const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");

const mapUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId || null,
  companyName: user.company?.name || null
});

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true }
  });

  if (!user || user.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return mapUser(user);
};

module.exports = {
  getMe
};
