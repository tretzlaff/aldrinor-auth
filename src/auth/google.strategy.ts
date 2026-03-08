import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { UserService } from '../user/user.service';
import type { User } from '../../generated/prisma';

const strategyOptions: any = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  scope: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
  ],
  // Force Google to always return a refresh_token (required for Drive access)
  accessType: 'offline',
  prompt: 'consent',
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly log = new Logger(GoogleStrategy.name);

  constructor(private readonly userService: UserService) {
    super(strategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const json = profile._json as {
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      picture?: string;
      locale?: string;
    };

    this.log.debug(
      `validate called — id=${profile.id} email=${json?.email ?? '(none)'}`,
    );

    try {
      const email = json.email ?? profile.emails?.[0]?.value ?? '';
      const emailVerified = json.email_verified ?? false;

      const user = await this.userService.upsertFromGoogle(
        {
          googleId: profile.id,
          email,
          emailVerified,
          displayName: profile.displayName,
          givenName: profile.name?.givenName ?? json.given_name,
          familyName: profile.name?.familyName ?? json.family_name,
          avatarUrl: profile.photos?.[0]?.value ?? json.picture,
          locale: json.locale,
        },
        {
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          scope:
            'email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
        },
      );

      this.log.debug(`upsert succeeded — userId=${user.id}`);
      return user;
    } catch (err) {
      this.log.error('upsertFromGoogle failed', err);
      throw err;
    }
  }
}
