const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");
const { ApiError } = require("../utils/ApiError");
const { sendInviteEmail } = require("../services/emailService");
const { ROLES } = require("../utils/roles");

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  organizationId: user.organizationId,
  adminId: user.adminId || null,
  createdAt: user.createdAt
});

const resolveOrganizationScope = (actor, payloadOrganizationId) => {
  if (actor.role === ROLES.SUPER_ADMIN) {
    return payloadOrganizationId || null;
  }

  if (actor.role === ROLES.ADMIN) {
    if (!actor.organizationId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admin is not scoped to an organization");
    }
    return actor.organizationId;
  }

  throw new ApiError(StatusCodes.FORBIDDEN, "Only admins can create users");
};

const buildInviteLink = (token) => {
  const appBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  return `${appBaseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
};

const listUsers = async (actor, pagination) => {
  const where = actor.role === "super_admin" ? {} : { organizationId: actor.organizationId };
  const users = await prisma.user.findMany({
    where,
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      adminId: true,
      createdAt: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
  return buildCursorResponse(users, pagination.limit);
};

const getMe = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organizationId: true,
      adminId: true,
      createdAt: true
    }
  });

const createUser = async ({ name, email, role = ROLES.EMPLOYEE, organizationId: payloadOrganizationId }, actor) => {
  const normalizedEmail = email.trim().toLowerCase();
  const organizationId = resolveOrganizationScope(actor, payloadOrganizationId);

  if (role === ROLES.ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only super_admin can create admins");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const createdUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role,
      status: "pending",
      passwordHash: null,
      inviteToken,
      inviteTokenExpiry,
      organizationId,
      adminId: role === ROLES.EMPLOYEE && actor.role === ROLES.ADMIN ? actor.sub : null
    }
  });

  try {
    await sendInviteEmail({
      to: createdUser.email,
      inviteLink: buildInviteLink(inviteToken)
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: createdUser.id } });
    throw new ApiError(StatusCodes.BAD_GATEWAY, error.message || "Failed to send invite email");
  }

  return sanitizeUser(createdUser);
};

const deleteUser = async (userId, actor) => {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true
    }
  });

  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (actor.sub === userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You cannot delete your own account");
  }

  if (target.role === ROLES.SUPER_ADMIN || target.email === process.env.SUPER_ADMIN_EMAIL) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Main admin account cannot be deleted");
  }

  if (actor.role === ROLES.ADMIN) {
    if (!actor.organizationId || actor.organizationId !== target.organizationId) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Cross-organization user deletion is not allowed");
    }
    if (target.role === ROLES.ADMIN) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admins cannot delete other admin accounts");
    }
  }

  // If super admin deletes an admin, cascade delete that admin's employees as well.
  if (actor.role === ROLES.SUPER_ADMIN && target.role === ROLES.ADMIN) {
    await prisma.user.deleteMany({ where: { adminId: target.id } });
  }

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new ApiError(StatusCodes.CONFLICT, "User cannot be deleted because related records exist");
    }
    throw error;
  }
};

module.exports = {
  listUsers,
  getMe,
  createUser,
  deleteUser
};
