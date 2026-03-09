const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { env } = require("../config/env");
const { ROLES } = require("../utils/roles");

const ensureSuperAdmin = async () => {
  const existing = await prisma.user.findUnique({
    where: { email: env.SUPER_ADMIN_EMAIL }
  });

  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12);
  return prisma.user.create({
    data: {
      name: "Super Admin",
      email: env.SUPER_ADMIN_EMAIL,
      password: passwordHash,
      role: ROLES.SUPER_ADMIN
    }
  });
};

module.exports = {
  ensureSuperAdmin
};

