const { z } = require("zod");

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  idSchema
};
