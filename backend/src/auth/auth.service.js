const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { ROLES } = require("../utils/roles");
const logger = require("../utils/logger");
const { generateSecureToken, hashToken, addMinutes } = require("../utils/tokens");
const { sendEmail } = require("../services/emailService");

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

const buildUniqueOrganizationSlug = async (companyName) => {
  const baseSlug = slugify(companyName) || "company";
  let slug = baseSlug;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.organizationId,
  companyName: user.organization?.name || null,
  createdBy: user.adminId || null,
  status: user.status,
  createdAt: user.createdAt
});

const buildTokens = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    companyId: user.organizationId || null
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

const getUserForAuth = async (email) =>
  prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

const register = async ({ name, adminName, email, password, companyName }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = (name || adminName || "").trim();

  if (!displayName) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Company owner name is required");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const existingOrganization = await prisma.organization.findUnique({ where: { name: companyName.trim() } });
  if (existingOrganization) {
    throw new ApiError(StatusCodes.CONFLICT, "Company name already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const organizationSlug = await buildUniqueOrganizationSlug(companyName);

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: companyName.trim(),
        slug: organizationSlug
      }
    });

    const adminUser = await tx.user.create({
      data: {
        name: displayName,
        email: normalizedEmail,
        passwordHash,
        role: ROLES.ADMIN,
        status: "active",
        organizationId: organization.id
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

    return { organization, adminUser };
  });

  logger.info("Company registration successful", {
    organizationId: created.organization.id,
    adminId: created.adminUser.id,
    email: normalizedEmail
  });

  return {
    user: sanitizeUser(created.adminUser),
    ...buildTokens(created.adminUser)
  };
};

const login = async ({ email, password }) => {
  const user = await getUserForAuth(email);

  if (!user || !user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.status === "archived" || user.status === "suspended") {
    throw new ApiError(StatusCodes.FORBIDDEN, "This account is not active");
  }

  if (user.status === "pending" || user.status === "invited") {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Please complete your account setup first");
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  logger.info("Login successful", { userId: user.id, role: user.role });

  return {
    user: sanitizeUser(user),
    ...buildTokens(user)
  };
};

const refresh = async ({ refreshToken }) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id || payload.sub },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  return {
    user: sanitizeUser(user),
    ...buildTokens(user)
  };
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return { delivered: true };
  }

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = addMinutes(new Date(), 30);

  await prisma.$transaction(async (tx) => {
    await tx.passwordReset.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: {
        usedAt: new Date()
      }
    });

    await tx.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });
  });

  const appBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  const resetLink = `${appBaseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

  await sendEmail(
    user.email,
    "TaskHive password reset",
    `
      <h2>Reset your TaskHive password</h2>
      <p>You requested a password reset for your TaskHive account.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
    `
  );

  return { delivered: true };
};

const resetPassword = async ({ token, password }) => {
  const tokenHash = hashToken(token);
  const now = new Date();

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now }
    }
  });

  if (!resetRecord) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        status: "active"
      }
    });

    await tx.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: now }
    });
  });

  return { success: true };
};

const setPassword = async ({ token, password }) => {
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      inviteToken: token,
      deletedAt: null
    }
  });

  if (!user || !user.inviteTokenExpiry || user.inviteTokenExpiry <= now) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired invite token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      status: "active",
      inviteToken: null,
      inviteTokenExpiry: null
    }
  });

  return { success: true };
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  setPassword,
  refresh
};
