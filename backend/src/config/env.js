const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive())
    .default("4000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  REFRESH_SECRET: z.string().min(32, "REFRESH_SECRET must be at least 32 chars"),
  COOKIE_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().url(),
  APP_BASE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(8),
  CORS_ORIGIN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = {
  env: {
    ...parsed.data,
    CORS_ORIGIN: parsed.data.CORS_ORIGIN || parsed.data.FRONTEND_URL
  }
};
