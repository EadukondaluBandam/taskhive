const { z } = require("zod");

const sendInvitationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    organizationId: z.string().uuid().optional(),
    role: z.enum(["owner", "admin", "manager", "member"]).optional().default("member")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    name: z.string().min(2).max(120),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = {
  sendInvitationSchema,
  acceptInvitationSchema
};
