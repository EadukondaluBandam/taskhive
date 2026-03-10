const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { ROLES } = require("../utils/roles");
const logger = require("../utils/logger");
const { generateSecureToken, hashToken, addMinutes } = require("../utils/tokens");
const { sendEmail } = require("../services/emailService");

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  organizationId: user.organizationId,
  adminId: user.adminId || null
});

const buildTokens = (user) => {
  const payload = {
    sub: user.id,
    role: user.role,
    organizationId: user.organizationId || null
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

const register = async ({ name, email, password, role, organizationId }, actor) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    logger.warn("Registration failed: email already registered", { email });
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  if (role !== ROLES.EMPLOYEE) {
    if (!actor) {
      logger.warn("Registration failed: privileged role without actor", { email, role });
      throw new ApiError(StatusCodes.FORBIDDEN, "Only authenticated admins can assign privileged roles");
    }
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
      logger.warn("Registration failed: insufficient role assignment permissions", {
        email,
        requestedRole: role,
        actorRole: actor.role
      });
      throw new ApiError(StatusCodes.FORBIDDEN, "Insufficient role assignment permissions");
    }
    if (role === ROLES.SUPER_ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
      logger.warn("Registration failed: non-super-admin attempted super_admin creation", {
        email,
        actorRole: actor.role
      });
      throw new ApiError(StatusCodes.FORBIDDEN, "Only super_admin can create super_admin");
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || ROLES.EMPLOYEE,
      status: "active",
      organizationId: organizationId || null,
      adminId: actor?.role === ROLES.ADMIN ? actor.sub : null
    }
  });

  logger.info("Registration successful", { userId: user.id, email: user.email, role: user.role });

  return {
    user: sanitizeUser(user),
    ...buildTokens(user)
  };
};

const registerCompany = async ({ companyName, adminName, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    logger.warn("Company registration failed: email already registered", { email });
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const existingOrganization = await prisma.organization.findUnique({ where: { name: companyName } });
  if (existingOrganization) {
    logger.warn("Company registration failed: organization already exists", { companyName });
    throw new ApiError(StatusCodes.CONFLICT, "Company name already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: companyName }
    });

    const adminUser = await tx.user.create({
      data: {
        name: adminName,
        email,
        passwordHash,
        role: ROLES.ADMIN,
        status: "active",
        inviteToken: null,
        inviteTokenExpiry: null,
        organizationId: organization.id
      }
    });

    return { organization, adminUser };
  });

  logger.info("Company registration successful", {
    organizationId: created.organization.id,
    adminUserId: created.adminUser.id,
    email
  });

  return {
    user: sanitizeUser(created.adminUser),
    organization: {
      id: created.organization.id,
      name: created.organization.name
    },
    defaults: {
      employees: 0,
      projects: 0,
      tasks: 0
    },
    ...buildTokens(created.adminUser)
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn("Login failed: user not found", { email });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (user.status === "pending") {
    logger.warn("Login failed: pending account", { email, userId: user.id });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Please check your email to set password");
  }
  if (!user.passwordHash) {
    logger.warn("Login failed: account has no password hash", { email, userId: user.id });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    logger.warn("Login failed: invalid password", { email });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  logger.info("Login successful", { userId: user.id, email: user.email, role: user.role });

  return {
    user: sanitizeUser(user),
    ...buildTokens(user)
  };
};

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) {
    logger.warn("Refresh failed: missing refresh token");
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    logger.warn("Refresh failed: invalid or expired token");
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    logger.warn("Refresh failed: user not found", { userId: payload.sub });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  logger.info("Refresh successful", { userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    ...buildTokens(user)
  };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    logger.info("Logout successful (no token provided)");
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    logger.info("Logout successful", { userId: payload.sub });
  } catch (_err) {
    logger.warn("Logout called with invalid refresh token");
  }
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.info("Forgot password requested for unknown email", { email });
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

  logger.info("Password reset email sent", { userId: user.id, email: user.email });
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
    },
    include: {
      user: true
    }
  });

  if (!resetRecord) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash }
    });

    await tx.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: now }
    });
  });

  logger.info("Password reset successful", { userId: resetRecord.userId });
  return { success: true };
};

const setPassword = async ({ token, password }) => {
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      inviteToken: token
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

  logger.info("Invite password set successfully", { userId: user.id, email: user.email });
  return { success: true };
};

module.exports = {
  register,
  registerCompany,
  login,
  forgotPassword,
  resetPassword,
  setPassword,
  refresh,
  logout
};
