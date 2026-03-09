require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const run = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required for seeding");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Super admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      passwordHash,
      role: "super_admin"
    }
  });

  console.log("Super admin created");
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
