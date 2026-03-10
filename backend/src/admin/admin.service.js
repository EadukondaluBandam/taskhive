const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");
const { ApiError } = require("../utils/ApiError");
const { sendInviteEmail } = require("../services/emailService");

const mapEmployee = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  companyId: user.organizationId,
  companyName: user.organization?.name || null,
  createdBy: user.adminId || null,
  createdByName: user.admin?.name || null,
  totalHours: 0,
  productivity: 0,
  createdAt: user.createdAt
});

const buildInviteLink = (token) => {
  const appBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  return `${appBaseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
};

const assertAdminScope = (actor) => {
  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(actor.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admins can manage employees");
  }

  if (actor.role === ROLES.ADMIN && !actor.companyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Admin is not assigned to a company");
  }
};

const listEmployees = async (actor) => {
  assertAdminScope(actor);

  const employees = await prisma.user.findMany({
    where: {
      role: ROLES.EMPLOYEE,
      deletedAt: null,
      ...(actor.role === ROLES.SUPER_ADMIN ? {} : { organizationId: actor.companyId })
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return employees.map(mapEmployee);
};

const createEmployee = async ({ name, email, password }, actor) => {
  assertAdminScope(actor);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  let passwordHash = null;
  let inviteToken = null;
  let inviteTokenExpiry = null;
  let status = "invited";

  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
    status = "active";
  } else {
    inviteToken = crypto.randomBytes(32).toString("hex");
    inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      inviteToken,
      inviteTokenExpiry,
      role: ROLES.EMPLOYEE,
      status,
      organizationId: actor.companyId,
      adminId: actor.id
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (inviteToken) {
    try {
      await sendInviteEmail({
        to: created.email,
        inviteLink: buildInviteLink(inviteToken)
      });
    } catch (error) {
      await prisma.user.delete({ where: { id: created.id } });
      throw new ApiError(StatusCodes.BAD_GATEWAY, error.message || "Failed to send invite email");
    }
  }

  return mapEmployee(created);
};

const updateEmployee = async (employeeId, updates, actor) => {
  assertAdminScope(actor);

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!employee || employee.deletedAt || employee.role !== ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  if (actor.role === ROLES.ADMIN && employee.organizationId !== actor.companyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only manage employees in your company");
  }

  if (updates.email) {
    const normalizedEmail = updates.email.trim().toLowerCase();
    if (normalizedEmail !== employee.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
      }
    }
    updates.email = normalizedEmail;
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: updates,
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return mapEmployee(updated);
};

const deleteEmployee = async (employeeId, actor) => {
  assertAdminScope(actor);

  const employee = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!employee || employee.deletedAt || employee.role !== ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  if (actor.role === ROLES.ADMIN && employee.organizationId !== actor.companyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only delete employees in your company");
  }

  try {
    await prisma.user.delete({ where: { id: employeeId } });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new ApiError(StatusCodes.CONFLICT, "Employee cannot be deleted because related records exist");
    }
    throw error;
  }
};

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
