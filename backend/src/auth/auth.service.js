const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ApiError } = require("../utils/ApiError");
const { signAccessToken } = require("../utils/jwt");
const { ROLES } = require("../utils/roles");

const mapUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId || null,
  companyName: user.company?.name || null
});

const buildToken = (user) =>
  signAccessToken({
    id: user.id,
    role: user.role,
    companyId: user.companyId || null
  });

const registerCompany = async ({ companyName, name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const [existingUser, existingCompany] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.company.findFirst({ where: { name: companyName.trim() } })
  ]);

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  if (existingCompany) {
    throw new ApiError(StatusCodes.CONFLICT, "Company name already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName.trim()
      }
    });

    const admin = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: ROLES.ADMIN,
        companyId: company.id
      },
      include: {
        company: true
      }
    });

    return {
      token: buildToken(admin),
      user: mapUser(admin)
    };
  });

  return result;
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { company: true }
  });

  if (!user || user.deletedAt) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  return {
    token: buildToken(user),
    user: mapUser(user)
  };
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (!user || user.deletedAt) {
    return { success: true };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry
    }
  });

  return { resetToken };
};

const resetPassword = async ({ token, newPassword }) => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      },
      deletedAt: null
    }
  });

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  return { success: true };
};

module.exports = {
  registerCompany,
  login,
  logout: async () => ({ success: true }),
  forgotPassword,
  resetPassword
};
