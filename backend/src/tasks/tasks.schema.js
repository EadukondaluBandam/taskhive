const { z } = require("zod");

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(140),
    projectId: z.string().uuid(),
    assignedToId: z.string().uuid().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    description: z.string().max(600).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  createTaskSchema
};
