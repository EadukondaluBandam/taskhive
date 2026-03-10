const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");
const { ApiError } = require("../utils/ApiError");

const sanitizeAdmin = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const sanitizeEmployee = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  adminId: user.adminId || null,
  adminName: user.admin?.name || null,
  createdAt: user.createdAt
});

const getDashboard = async () => {
  const [adminCount, employeeCount, organizationCount, userCount] = await Promise.all([
    prisma.user.count({ where: { role: ROLES.ADMIN } }),
    prisma.user.count({ where: { role: ROLES.EMPLOYEE } }),
    prisma.organization.count(),
    prisma.user.count()
  ]);

  return {
    adminCount,
    employeeCount,
    organizationCount,
    userCount
  };
};

const listAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: { role: ROLES.ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return admins.map(sanitizeAdmin);
};

const listEmployees = async () => {
  const employees = await prisma.user.findMany({
    where: { role: ROLES.EMPLOYEE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminId: true,
      admin: {
        select: {
          id: true,
          name: true
        }
      },
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return employees.map(sanitizeEmployee);
};

const deleteAdmin = async (adminId) => {
  const admin = await prisma.user.findUnique({
    where: { id: adminId }
  });

  if (!admin || admin.role !== ROLES.ADMIN) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  await prisma.$transaction([
    prisma.user.deleteMany({ where: { adminId } }),
    prisma.user.delete({ where: { id: adminId } })
  ]);
};

const deleteEmployee = async (employeeId) => {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!employee || employee.role !== ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  await prisma.user.delete({ where: { id: employeeId } });
};

module.exports = {
  getDashboard,
  listAdmins,
  listEmployees,
  deleteAdmin,
  deleteEmployee
};
