const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const listActivities = async (actor, pagination) => {
  const activities = await prisma.activity.findMany({
    where:
      actor.role === "super_admin"
        ? {}
        : { user: { organizationId: actor.organizationId } },
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(activities, pagination.limit);
};

module.exports = {
  listActivities
};
