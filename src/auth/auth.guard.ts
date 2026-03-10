import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  getAuthenticateOptions() {
    return {
      accessType: 'offline',
      prompt: 'consent',
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
