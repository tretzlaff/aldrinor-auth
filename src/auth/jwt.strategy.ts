import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import type { User } from '../../generated/prisma';

export interface JwtPayload {
  sub: string; // user id as string (BigInt serialized)
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(BigInt(payload.sub));
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
