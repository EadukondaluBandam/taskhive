const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config/database");
const { ROLES } = require("../utils/roles");
const { ApiError } = require("../utils/ApiError");
const { sendInviteEmail } = require("../services/emailService");

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

const buildInviteLink = (token) => {
  const appBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  return `${appBaseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
};

const mapAdmin = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  companyId: user.organizationId,
  companyName: user.organization?.name || null,
  createdAt: user.createdAt
});

const mapEmployee = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  companyId: user.organizationId,
  companyName: user.organization?.name || null,
  createdBy: user.adminId || null,
  createdByName: user.admin?.name || null,
  createdAt: user.createdAt
});

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

const getDashboard = async () => {
  const [adminCount, employeeCount, companyCount, userCount] = await Promise.all([
    prisma.user.count({ where: { role: ROLES.ADMIN, deletedAt: null } }),
    prisma.user.count({ where: { role: ROLES.EMPLOYEE, deletedAt: null } }),
    prisma.organization.count(),
    prisma.user.count({ where: { deletedAt: null } })
  ]);

  return {
    adminCount,
    employeeCount,
    companyCount,
    userCount
  };
};

const listAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: ROLES.ADMIN,
      deletedAt: null
    },
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

  return admins.map(mapAdmin);
};

const createAdmin = async ({ name, email, companyName, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const existingOrganization = await prisma.organization.findUnique({ where: { name: companyName.trim() } });
  if (existingOrganization) {
    throw new ApiError(StatusCodes.CONFLICT, "Company name already in use");
  }

  let passwordHash = null;
  let inviteToken = null;
  let inviteTokenExpiry = null;
  let status = "invited";

  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
    status = "active";
  } else {
    inviteToken = crypto.randomBytes(32).toString("hex");
    inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const organizationSlug = await buildUniqueOrganizationSlug(companyName);

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: companyName.trim(),
        slug: organizationSlug
      }
    });

    const admin = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        inviteToken,
        inviteTokenExpiry,
        role: ROLES.ADMIN,
        status,
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

    return admin;
  });

  if (inviteToken) {
    try {
      await sendInviteEmail({
        to: created.email,
        inviteLink: buildInviteLink(inviteToken)
      });
    } catch (error) {
      await prisma.$transaction([
        prisma.user.delete({ where: { id: created.id } }),
        prisma.organization.delete({ where: { id: created.organizationId } })
      ]);
      throw new ApiError(StatusCodes.BAD_GATEWAY, error.message || "Failed to send invite email");
    }
  }

  return mapAdmin(created);
};

const listEmployees = async () => {
  const employees = await prisma.user.findMany({
    where: {
      role: ROLES.EMPLOYEE,
      deletedAt: null
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return employees.map(mapEmployee);
};

const createEmployee = async ({ name, email, companyId, createdBy, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already registered");
  }

  const company = await prisma.organization.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
  }

  let adminUser = null;
  if (createdBy) {
    adminUser = await prisma.user.findUnique({
      where: { id: createdBy }
    });

    if (!adminUser || adminUser.role !== ROLES.ADMIN || adminUser.organizationId !== companyId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "createdBy must be an admin in the selected company");
    }
  }

  let passwordHash = null;
  let inviteToken = null;
  let inviteTokenExpiry = null;
  let status = "invited";

  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
    status = "active";
  } else {
    inviteToken = crypto.randomBytes(32).toString("hex");
    inviteTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const employee = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      inviteToken,
      inviteTokenExpiry,
      role: ROLES.EMPLOYEE,
      status,
      organizationId: companyId,
      adminId: adminUser?.id || null
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      admin: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (inviteToken) {
    try {
      await sendInviteEmail({
        to: employee.email,
        inviteLink: buildInviteLink(inviteToken)
      });
    } catch (error) {
      await prisma.user.delete({ where: { id: employee.id } });
      throw new ApiError(StatusCodes.BAD_GATEWAY, error.message || "Failed to send invite email");
    }
  }

  return mapEmployee(employee);
};

const deleteAdmin = async (adminId) => {
  const admin = await prisma.user.findUnique({
    where: { id: adminId }
  });

  if (!admin || admin.deletedAt || admin.role !== ROLES.ADMIN) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Admin not found");
  }

  try {
    await prisma.$transaction([
      prisma.user.deleteMany({
        where: {
          adminId,
          role: ROLES.EMPLOYEE
        }
      }),
      prisma.user.delete({ where: { id: adminId } })
    ]);
  } catch (error) {
    if (error?.code === "P2003") {
      throw new ApiError(StatusCodes.CONFLICT, "Admin cannot be deleted because related records exist");
    }
    throw error;
  }
};

const deleteEmployee = async (employeeId) => {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId }
  });

  if (!employee || employee.deletedAt || employee.role !== ROLES.EMPLOYEE) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Employee not found");
  }

  try {
    await prisma.user.delete({ where: { id: employeeId } });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new ApiError(StatusCodes.CONFLICT, "Employee cannot be deleted because related records exist");
    }
    throw error;
  }
};

module.exports = {
  getDashboard,
  listAdmins,
  createAdmin,
  listEmployees,
  createEmployee,
  deleteAdmin,
  deleteEmployee
};
