import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { User } from '../../generated/prisma';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  givenName?: string;
  familyName?: string;
  avatarUrl?: string;
  locale?: string;
}

export interface GoogleTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: bigint): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  async findGoogleToken(userId: bigint) {
    return this.prisma.db.googleToken.findUnique({ where: { userId } });
  }

  async upsertFromGoogle(
    profile: GoogleProfile,
    tokens: GoogleTokenSet,
  ): Promise<User> {
    const user = await this.prisma.db.user.upsert({
      where: { googleId: profile.googleId },
      update: {
        email: profile.email,
        emailVerified: profile.emailVerified,
        displayName: profile.displayName,
        givenName: profile.givenName ?? null,
        familyName: profile.familyName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        locale: profile.locale ?? null,
      },
      create: {
        googleId: profile.googleId,
        email: profile.email,
        emailVerified: profile.emailVerified,
        displayName: profile.displayName,
        givenName: profile.givenName ?? null,
        familyName: profile.familyName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        locale: profile.locale ?? null,
      },
    });

    // Google only returns a refresh_token on first consent (or when prompt:'consent'
    // is set). Only overwrite the stored refresh token when a fresh one is provided.
    const tokenUpdate = {
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
    };

    await this.prisma.db.googleToken.upsert({
      where: { userId: user.id },
      update: tokenUpdate,
      create: {
        userId: user.id,
        accessToken: tokens.accessToken,
        // On first login, refreshToken must be present; Google guarantees this
        // when accessType:'offline' + prompt:'consent' are set in the strategy.
        refreshToken: tokens.refreshToken ?? '',
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      },
    });

    return user;
  }
}
