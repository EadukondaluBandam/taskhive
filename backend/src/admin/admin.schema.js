const { z } = require("zod");

const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(128).optional()
  }),
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({}).optional()
});

const employeeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema
};
