const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const { ROLES } = require("../utils/roles");

const mapEmployee = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId,
  companyName: user.company?.name || null,
  createdAt: user.createdAt
});

const assertAdminCompany = (actor) => {
  if (!actor.companyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Admin is not assigned to a company");
  }
};

const listEmployees = async (actor) => {
  assertAdminCompany(actor);

  const employees = await prisma.user.findMany({
    where: {
      role: ROLES.EMPLOYEE,
      companyId: actor.companyId,
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

  return employees.map(mapEmployee);
};

const createEmployee = async ({ name, email, password }, actor) => {
  assertAdminCompany(actor);
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const employee = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: ROLES.EMPLOYEE,
      companyId: actor.companyId,
      createdBy: actor.id
    },
    include: {
      company: true
    }
  });

  return mapEmployee(employee);
};

const updateEmployee = async (employeeId, updates, actor) => {
  assertAdminCompany(actor);

  const existing = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: ROLES.EMPLOYEE,
      companyId: actor.companyId,
      deletedAt: null
    },
    include: {
      company: true
    }
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  const data = {};
  if (updates.name) data.name = updates.name.trim();
  if (updates.email) {
    const normalizedEmail = updates.email.trim().toLowerCase();
    if (normalizedEmail !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (duplicate) {
        throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
      }
    }
    data.email = normalizedEmail;
  }
  if (updates.password) {
    data.password = await bcrypt.hash(updates.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data,
    include: {
      company: true
    }
  });

  return mapEmployee(updated);
};

const deleteEmployee = async (employeeId, actor) => {
  assertAdminCompany(actor);

  const existing = await prisma.user.findFirst({
    where: {
      id: employeeId,
      role: ROLES.EMPLOYEE,
      companyId: actor.companyId,
      deletedAt: null
    }
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  await prisma.user.update({
    where: { id: employeeId },
    data: { deletedAt: new Date() }
  });
};

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
