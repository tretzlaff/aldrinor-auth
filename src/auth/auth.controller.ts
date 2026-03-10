import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { User } from '../generated/prisma';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { GoogleAuthGuard, JwtAuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Step 1: redirect browser to Google consent screen.
   */
  @ApiOperation({ summary: 'Redirect to Google OAuth consent' })
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(): void {
    // Handled by Passport — redirects automatically
  }

  /**
   * Step 2: Google redirects back here after consent.
   * Issues a JWT and redirects to the UI with it in the query string
   * so the SPA can store it in memory/localStorage.
   */
  @ApiOperation({ summary: 'Google OAuth callback — issues JWT' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as User;
    const token = this.authService.issueJwt(user);
    const uiBase = (
      this.configService.get<string>('UI_BASE_URL') ?? 'http://localhost:3002'
    ).replace(/\/$/, '');
    res.redirect(`${uiBase}/auth/callback?token=${token}`);
  }

  /**
   * Re-initiates Google OAuth with forced consent to obtain a fresh
   * refresh token when the stored one has expired.
   */
  @ApiOperation({ summary: 'Force Google reauth to refresh Drive token' })
  @UseGuards(GoogleAuthGuard)
  @Get('refresh-google')
  refreshGoogle(): void {
    // Handled by Passport
  }

  /**
   * Returns the current authenticated user from the JWT.
   */
  @ApiOperation({ summary: 'Get current authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: Request): User {
    return req.user as User;
  }

  /**
   * Returns the stored Google OAuth token for the authenticated user.
   * Used by internal services (e.g. contentfac-ms) to obtain Drive tokens
   * without direct cross-schema DB access.
   */
  @ApiOperation({ summary: 'Get stored Google OAuth token for current user' })
  @UseGuards(JwtAuthGuard)
  @Get('tokens/me')
  async getMyTokens(@Req() req: Request) {
    const user = req.user as User;
    const token = await this.userService.findGoogleToken(user.id);
    if (!token) {
      throw new NotFoundException(
        'No Google token found for user. Please complete OAuth login.',
      );
    }
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      scope: token.scope,
    };
  }

  /**
   * Logout — client drops the token; this is a convenience no-op.
   */
  @ApiOperation({ summary: 'Logout (client should discard JWT)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(): void {
    // JWT is stateless — client simply discards the token.
  }
}
