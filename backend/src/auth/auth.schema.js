const { z } = require("zod");

const registerCompanySchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(160),
    name: z.string().min(2).max(120),
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
    newPassword: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const logoutSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  registerCompanySchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema
};
