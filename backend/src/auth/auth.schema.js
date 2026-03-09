const { z } = require("zod");
const { ROLES } = require("../utils/roles");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z
      .enum([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE])
      .optional()
      .default(ROLES.EMPLOYEE),
    organizationId: z.string().uuid().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const registerCompanySchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(160),
    adminName: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  registerSchema,
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema
};
