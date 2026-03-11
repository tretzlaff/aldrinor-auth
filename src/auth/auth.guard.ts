import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const isRefresh = req.path.includes('refresh-google');

    if (isRefresh) {
      return {
        accessType: 'offline',
        prompt: 'consent',
      };
    }

    return {
      accessType: 'offline',
    };
  }

  handleRequest<T>(err: any, user: any, info: any): T {
    if (err || !user) {
      this.logger.error('Google OAuth error', { err, info });
      throw err ?? new UnauthorizedException(String(info));
    }
    return user as T;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
