const { z } = require("zod");

const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

module.exports = {
  createEmployeeSchema,
  idParamSchema
};
