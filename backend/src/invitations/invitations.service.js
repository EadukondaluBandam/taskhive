const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const logger = require("../utils/logger");
const { generateSecureToken, hashToken, addMinutes } = require("../utils/tokens");
const { sendEmail } = require("../services/emailService");
const { ROLES } = require("../utils/roles");

const requireOrganizationScope = async (actor, organizationId) => {
  if (actor.role === ROLES.SUPER_ADMIN) {
    if (!organizationId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "organizationId is required for super_admin invitations");
    }
    return organizationId;
  }

  if (!actor.organizationId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Admin is not scoped to an organization");
  }
  return actor.organizationId;
};

const toUserRole = (invitationRole) => {
  if (invitationRole === "owner" || invitationRole === "admin" || invitationRole === "manager") {
    return ROLES.ADMIN;
  }
  return ROLES.EMPLOYEE;
};

const sendInvitation = async ({ email, organizationId, role }, actor) => {
  const orgId = await requireOrganizationScope(actor, organizationId);

  const [organization, existingUser] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findUnique({ where: { email } })
  ]);

  if (!organization) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Organization not found");
  }

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists with this email");
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = addMinutes(new Date(), 30);

  await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: {
        organizationId: orgId,
        email,
        status: "pending"
      },
      data: {
        status: "revoked"
      }
    });

    await tx.invitation.create({
      data: {
        organizationId: orgId,
        email,
        role,
        tokenHash,
        invitedById: actor.sub,
        expiresAt
      }
    });
  });

  const baseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  const setPasswordLink = `${baseUrl.replace(/\/$/, "")}/accept-invitation?token=${rawToken}`;

  await sendEmail(
    email,
    `You are invited to join ${organization.name} on TaskHive`,
    `
      <h2>TaskHive Invitation</h2>
      <p>${actor.role} invited you to join <strong>${organization.name}</strong> on TaskHive.</p>
      <p><a href="${setPasswordLink}">Set your password and accept invitation</a></p>
      <p>This invitation link expires in 30 minutes.</p>
    `
  );

  logger.info("Invitation sent", { organizationId: orgId, email, invitedBy: actor.sub, role });
  return { delivered: true };
};

const acceptInvitation = async ({ token, name, password }) => {
  const tokenHash = hashToken(token);
  const now = new Date();

  const invitation = await prisma.invitation.findFirst({
    where: {
      tokenHash,
      status: "pending",
      acceptedAt: null,
      expiresAt: { gt: now }
    },
    include: {
      organization: true
    }
  });

  if (!invitation) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired invitation token");
  }

  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists for this email");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userRole = toUserRole(invitation.role);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email: invitation.email,
        password: passwordHash,
        role: userRole,
        status: "active",
        organizationId: invitation.organizationId
      }
    });

    await tx.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: createdUser.id,
        role: invitation.role,
        status: "active",
        joinedAt: now
      }
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: now
      }
    });

    return createdUser;
  });

  logger.info("Invitation accepted", { invitationId: invitation.id, userId: user.id, organizationId: invitation.organizationId });
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    }
  };
};

module.exports = {
  sendInvitation,
  acceptInvitation
};

