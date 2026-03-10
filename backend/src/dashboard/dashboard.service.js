const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");

const getAdminDashboard = async (actor) => {
  const [employeeCount, projectCount] = await Promise.all([
    prisma.user.count({
      where: {
        role: ROLES.EMPLOYEE,
        companyId: actor.companyId,
        deletedAt: null
      }
    }),
    prisma.project.count({
      where: {
        companyId: actor.companyId,
        deletedAt: null
      }
    })
  ]);

  return {
    employeeCount,
    projectCount,
    taskCount: 0
  };
};

const getSuperadminDashboard = async () => {
  const [totalCompanies, totalAdmins, totalEmployees] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({
      where: {
        role: ROLES.ADMIN,
        deletedAt: null
      }
    }),
    prisma.user.count({
      where: {
        role: ROLES.EMPLOYEE,
        deletedAt: null
      }
    })
  ]);

  return {
    totalCompanies,
    totalAdmins,
    totalEmployees
  };
};

module.exports = {
  getAdminDashboard,
  getSuperadminDashboard
};
