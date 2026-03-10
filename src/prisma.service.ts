import {
  Injectable,
  OnModuleDestroy,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public db!: PrismaClient;
  private pool!: Pool;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const url = new URL(connectionString);
    const schema = url.searchParams.get('schema') ?? 'public';
    url.searchParams.delete('schema');

    this.pool = new Pool({
      connectionString: url.toString(),
      options: `-c search_path=${schema}`,
    });
    const adapter = new PrismaPg(this.pool, { schema });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.db = new PrismaClient({ adapter } as any);
    await this.db.$connect();
    this.logger.log(`Connected to database (schema=${schema})`);
  }

  async onModuleDestroy() {
    if (this.db) await this.db.$disconnect();
    if (this.pool) await this.pool.end();
  }
}
