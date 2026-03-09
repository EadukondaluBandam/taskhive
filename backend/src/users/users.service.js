const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const listUsers = async (actor, pagination) => {
  const where = actor.role === "super_admin" ? {} : { organizationId: actor.organizationId };
  const users = await prisma.user.findMany({
    where,
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(users, pagination.limit);
};

const getMe = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true
    }
  });

module.exports = {
  listUsers,
  getMe
};
