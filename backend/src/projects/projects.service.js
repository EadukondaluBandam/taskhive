const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");

const createProject = async (payload) =>
  prisma.project.create({
    data: payload
  });

const listProjects = async (actor, pagination) => {
  const projects = await prisma.project.findMany({
    where: actor.role === "super_admin" ? {} : { organizationId: actor.organizationId },
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(projects, pagination.limit);
};

module.exports = {
  createProject,
  listProjects
};
