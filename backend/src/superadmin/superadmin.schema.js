const { z } = require("zod");

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

module.exports = {
  idParamSchema
};
