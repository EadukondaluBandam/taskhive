require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedSuperadmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !rawPassword) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log(`Superadmin already exists: ${email}`);
    return;
  }

  const password = await bcrypt.hash(rawPassword, 12);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      password,
      role: "superadmin"
    }
  });

  console.log(`Superadmin created: ${email}`);
}

seedSuperadmin()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
