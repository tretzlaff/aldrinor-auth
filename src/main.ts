import 'dotenv/config';

// BigInt cannot be serialized to JSON by default — convert to string
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(BigInt.prototype as any).toJSON = function (this: bigint) {
  return this.toString();
};

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnv } from './env.validation';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors({
    origin: ['http://localhost:3002', 'https://localhost:3002'],
  });
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
