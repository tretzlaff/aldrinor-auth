import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../generated/prisma';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  issueJwt(user: User): string {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  issueRefreshToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
