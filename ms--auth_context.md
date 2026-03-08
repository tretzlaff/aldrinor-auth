# Microservice Context

## Service Name

auth

## Purpose

Google OAuth 2.0 authentication service. Handles the Google OAuth flow, issues JWTs for the SPA (contentfac), stores and manages Google access/refresh tokens per user in Postgres, and provides token-refresh endpoints for re-authorization when Drive tokens expire. Exposes GET /auth/tokens/me so internal services can retrieve Drive tokens via HTTP.

## Deployment Mode

- [x] Standalone
- [ ] Monorepo

## Path

C:\code\wb\aldrinor-auth

## Required Modules

- Zod
- Pino
- Vitest
- TSX
- TSUP
- ESLint
- Prettier

## Options

- [ ] Turborepo
