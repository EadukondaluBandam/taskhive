const { prisma } = require("../config/database");

const createOrganization = async (name) =>
  prisma.organization.create({
    data: { name }
  });

const listOrganizations = async () =>
  prisma.organization.findMany({
    orderBy: { createdAt: "desc" }
  });

module.exports = {
  createOrganization,
  listOrganizations
};
