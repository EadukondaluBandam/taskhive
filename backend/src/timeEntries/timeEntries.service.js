const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const createTimeEntry = async (payload, actor) =>
  prisma.timeEntry.create({
    data: {
      ...payload,
      userId: actor.sub,
      startedAt: new Date(payload.startedAt),
      endedAt: payload.endedAt ? new Date(payload.endedAt) : null
    }
  });

const listTimeEntries = async (actor, pagination) => {
  const entries = await prisma.timeEntry.findMany({
    where:
      actor.role === "employee"
        ? { userId: actor.sub }
        : actor.role === "super_admin"
          ? {}
          : { user: { organizationId: actor.organizationId } },
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    include: {
      task: { select: { id: true, name: true } }
    },
    orderBy: [{ startTime: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(entries, pagination.limit);
};

module.exports = {
  createTimeEntry,
  listTimeEntries
};
