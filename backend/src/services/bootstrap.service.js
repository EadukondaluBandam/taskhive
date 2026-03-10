const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { env } = require("../config/env");
const { ROLES } = require("../utils/roles");

const ensureSuperAdmin = async () => {
  const email = env.SUPER_ADMIN_EMAIL.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) return existing;

  const password = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12);

  return prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password,
      role: ROLES.SUPERADMIN
    }
  });
};

module.exports = {
  ensureSuperAdmin
};
