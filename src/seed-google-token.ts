/**
 * Phase 5: Seed initial GoogleToken row from existing refresh token.
 *
 * Run once from the auth service directory:
 *   npx tsx src/seed-google-token.ts
 *
 * Requires GOOGLE_REFRESH_TOKEN in auth/.env (copy from content/.env temporarily).
 * After this runs, do a real OAuth login through the UI to replace
 * the placeholder row with a properly-issued token set.
 */

import 'dotenv/config';
import { PrismaClient, type Prisma } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('GOOGLE_REFRESH_TOKEN is not set');

  const url = new URL(dbUrl);
  const schema = url.searchParams.get('schema') ?? 'auth';
  url.searchParams.delete('schema');

  const pool = new Pool({
    connectionString: url.toString(),
    options: `-c search_path=${schema}`,
  });

  const adapter = new PrismaPg(pool, { schema });

  const prisma = new PrismaClient({
    adapter,
  } satisfies Prisma.PrismaClientOptions);
  await prisma.$connect();

  // Upsert the placeholder User row
  const user = await prisma.user.upsert({
    where: { googleId: 'PLACEHOLDER_SEED' },
    update: {},
    create: {
      googleId: 'PLACEHOLDER_SEED',
      email: 'seed@placeholder.local',
      displayName: 'Seeded User (replace via OAuth login)',
    },
  });

  console.log('User row:', user);

  // Upsert the GoogleToken row with the existing refresh token
  const token = await prisma.googleToken.upsert({
    where: { userId: user.id },
    update: {
      refreshToken,
      accessToken: 'PENDING_REFRESH',
      expiresAt: new Date(0), // intentionally expired — Drive will auto-refresh
      scope:
        'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
    },
    create: {
      userId: user.id,
      refreshToken,
      accessToken: 'PENDING_REFRESH',
      expiresAt: new Date(0),
      scope:
        'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
    },
  });

  console.log('GoogleToken row:', token);
  console.log(
    '\n✅ Seed complete. Log in via the UI to replace this with a real token.',
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
