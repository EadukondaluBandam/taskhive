const { z } = require("zod");

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    organizationId: z.string().uuid(),
    description: z.string().max(400).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  createProjectSchema
};
