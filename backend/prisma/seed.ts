import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set");
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ role: Role.super_admin }, { email: email.toLowerCase() }]
    },
    select: { id: true, email: true, role: true }
  });

  if (existingSuperAdmin) {
    console.log(
      `Super admin already exists (email: ${existingSuperAdmin.email}, role: ${existingSuperAdmin.role})`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: email.toLowerCase(),
      password: passwordHash,
      role: Role.super_admin,
      status: "active"
    }
  });

  console.log(`Super admin created with email: ${email.toLowerCase()}`);
}

seedSuperAdmin()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

