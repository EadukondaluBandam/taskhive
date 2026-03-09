const { z } = require("zod");

const createTimeEntrySchema = z.object({
  body: z.object({
    taskId: z.string().uuid(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().optional(),
    notes: z.string().max(500).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  createTimeEntrySchema
};
