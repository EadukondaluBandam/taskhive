const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    companyName: z.string().min(2).max(160),
    password: z.string().min(8).max(128).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    companyId: z.string().uuid(),
    createdBy: z.string().uuid().optional(),
    password: z.string().min(8).max(128).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  idParamSchema,
  createAdminSchema,
  createEmployeeSchema
};
