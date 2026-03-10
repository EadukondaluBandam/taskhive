const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { buildCursorResponse } = require("../utils/pagination");
const { ApiError } = require("../utils/ApiError");
const { sendInviteEmail } = require("../services/emailService");
const { ROLES } = require("../utils/roles");

const mapUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  companyId: user.organizationId,
  companyName: user.organization?.name || null,
  createdBy: user.adminId || null,
  createdAt: user.createdAt
});

const buildInviteLink = (token) => {
  const appBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  return `${appBaseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
};

const listUsers = async (actor, pagination) => {
  const where = {
    deletedAt: null,
    ...(actor.role === ROLES.SUPER_ADMIN ? {} : { organizationId: actor.companyId })
  };

  const users = await prisma.user.findMany({
    where,
    take: pagination.limit + 1,
    ...(pagination.cursor
      ? {
          skip: 1,
          cursor: { id: pagination.cursor }
        }
      : {}),
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return buildCursorResponse(users.map(mapUser), pagination.limit);
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!user || user.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return mapUser(user);
};

const createUser = async ({ name, email, role = ROLES.EMPLOYEE, organizationId }, actor) => {
  if (actor.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only superadmin can create users with this route");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  if (role === ROLES.ADMIN && !organizationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "organizationId is required to create an admin with this route");
  }

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const createdUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role,
      status: "invited",
      passwordHash: null,
      inviteToken,
      inviteTokenExpiry,
      organizationId: organizationId || null
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
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

  return mapUser(createdUser);
};

const deleteUser = async (userId, actor) => {
  const target = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!target || target.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (actor.id === target.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You cannot delete your own account");
  }

  if (target.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Superadmin cannot be deleted");
  }

  if (actor.role === ROLES.ADMIN) {
    if (target.organizationId !== actor.companyId || target.role !== ROLES.EMPLOYEE) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Admins can only delete employees in their company");
    }
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
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
