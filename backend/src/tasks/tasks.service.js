const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const createTask = async (payload) =>
  prisma.task.create({
    data: {
      ...payload,
      status: payload.status || "todo"
    }
  });

const listTasks = async (actor, pagination) => {
  const tasks = await prisma.task.findMany({
    where:
      actor.role === "employee"
        ? { assignedToId: actor.sub }
        : actor.role === "super_admin"
          ? {}
          : { project: { organizationId: actor.organizationId } },
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    include: {
      project: { select: { id: true, name: true } }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(tasks, pagination.limit);
};

module.exports = {
  createTask,
  listTasks
};
