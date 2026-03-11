import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3003),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string().min(8),
  GOOGLE_CALLBACK_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().default('15m'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3002')
    .transform((val) => val.split(',').map((s) => s.trim())),
  UI_BASE_URL: z.string().url().default('http://localhost:3002'),
});

export type Env = z.infer<typeof envSchema>;

/** Call at startup to validate process.env */
export function validateEnv() {
  return envSchema.parse(process.env);
}
