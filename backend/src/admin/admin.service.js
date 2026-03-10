const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");
const { ApiError } = require("../utils/ApiError");

const sanitizeEmployee = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  adminId: user.adminId || null,
  createdAt: user.createdAt
});

const getEmployees = async (actor) => {
  if (actor.role === ROLES.SUPER_ADMIN) {
    // Super admin can view all employees
    const employees = await prisma.user.findMany({
      where: { role: ROLES.EMPLOYEE },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminId: true,
        createdAt: true
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });
    return employees.map(sanitizeEmployee);
  }

  // Admin can see only their employees
  const employees = await prisma.user.findMany({
    where: { role: ROLES.EMPLOYEE, adminId: actor.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminId: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return employees.map(sanitizeEmployee);
};

const createEmployee = async ({ name, email }, actor) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admins can create employees");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role: ROLES.EMPLOYEE,
      status: "active",
      organizationId: actor.organizationId || null,
      adminId: actor.sub
    }
  });

  return sanitizeEmployee(created);
};

const deleteEmployee = async (employeeId, actor) => {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!employee || employee.role !== ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  if (actor.role === ROLES.ADMIN && employee.adminId !== actor.sub) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Admins can only delete their own employees");
  }

  await prisma.user.delete({ where: { id: employeeId } });
};

module.exports = {
  getEmployees,
  createEmployee,
  deleteEmployee
};
