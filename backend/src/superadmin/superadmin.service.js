const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const { ROLES } = require("../utils/roles");

const listCompanies = async () =>
  prisma.company.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          projects: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

const listAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: ROLES.ADMIN,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      createdAt: true,
      company: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    companyId: admin.companyId,
    companyName: admin.company?.name || null,
    createdAt: admin.createdAt
  }));
};

const listEmployees = async () => {
  const employees = await prisma.user.findMany({
    where: {
      role: ROLES.EMPLOYEE,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          name: true
        }
      },
      company: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    companyId: employee.companyId,
    companyName: employee.company?.name || null,
    createdAt: employee.createdAt
  }));
};

const deleteAdmin = async (adminId) => {
  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: ROLES.ADMIN,
      deletedAt: null
    }
  });

  if (!admin) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        createdBy: admin.id,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    }),
    prisma.user.update({
      where: { id: admin.id },
      data: { deletedAt: new Date() }
    })
  ]);
};

const deleteUser = async (userId) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null
    }
  });

  if (!user || user.role === ROLES.SUPERADMIN) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date() }
  });
};

module.exports = {
  listCompanies,
  listAdmins,
  listEmployees,
  deleteAdmin,
  deleteUser
};
