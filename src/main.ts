import 'dotenv/config';

// BigInt cannot be serialized to JSON by default — convert to string
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(BigInt.prototype as any).toJSON = function (this: bigint) {
  return this.toString();
};

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import * as fs from 'fs';
import * as path from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { validateEnv } from './env.validation';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const env = validateEnv();

  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'localhost.pem')),
  };

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    httpsOptions,
  });
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  app.use(cookieParser());
  app.useLogger(app.get(Logger));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter({ httpAdapter } as HttpAdapterHost),
  );

  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(env.PORT);
}
void bootstrap();
