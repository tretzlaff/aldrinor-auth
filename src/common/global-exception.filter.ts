import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const nested = (res as Record<string, unknown>).message;
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        message = nested ? String(nested) : JSON.stringify(res);
      }
    } else if (
      exception instanceof Error &&
      'code' in exception &&
      typeof (exception as Record<string, unknown>).code === 'string'
    ) {
      // Prisma known-request errors (P2025, P2002, P2003)
      const code = (exception as Record<string, unknown>).code as string;
      const meta = (exception as Record<string, unknown>).meta as
        | Record<string, unknown>
        | undefined;
      switch (code) {
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          message = `Unique constraint violated on: ${String(meta?.target ?? 'unknown')}`;
          break;
        case 'P2003':
          httpStatus = HttpStatus.BAD_REQUEST;
          message = 'Related record not found';
          break;
        default:
          message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      error: HttpStatus[httpStatus] ?? 'Error',
      timestamp: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
