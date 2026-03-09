const { z } = require("zod");

const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  createOrganizationSchema
};
