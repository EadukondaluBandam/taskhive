const { z } = require("zod");
const { ROLES } = require("../utils/roles");

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE]).optional().default(ROLES.EMPLOYEE),
    organizationId: z.string().uuid().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const deleteUserSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid()
  }),
  query: z.object({}).optional()
});

module.exports = {
  createUserSchema,
  deleteUserSchema
};
