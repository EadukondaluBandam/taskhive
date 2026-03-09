const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const listNotifications = async (userId, pagination) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(notifications, pagination.limit);
};

module.exports = {
  listNotifications
};
