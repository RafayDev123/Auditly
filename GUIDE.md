# GUIDE.md — WEBSITEAUDIT AI Setup Guide

This guide explains how to run WebsiteAudit AI from scratch.

## 1) Prerequisites

Install:

- Node.js 20+
- npm 10+
- Git
- PostgreSQL (or Supabase PostgreSQL)
- Optional: Supabase account + Supabase CLI

## 2) Project Installation

```bash
git clone <your-repo-url>
cd WEBSITEAUDIT-AI
npm install
```

## 3) Supabase Setup

1. Create a Supabase project.
2. Open **Project Settings → API**.
3. Copy:
   - Project URL
   - anon key
   - service role key (server-only)
4. Open **Project Settings → Database** and copy your connection string.
5. Run migrations from `supabase/migrations` in order:

```bash
psql "<SUPABASE_DB_URL>" -f supabase/migrations/001_initial_schema.sql
psql "<SUPABASE_DB_URL>" -f supabase/migrations/002_indexes_and_rls.sql
```

6. (Optional) Seed:

```bash
psql "<SUPABASE_DB_URL>" -f supabase/seed/seed.sql
```

## 4) Database Schema

Main tables:

- `users`: app users
- `auth_sessions`: secure session tokens
- `password_reset_tokens`: reset flow
- `websites`: tracked domains
- `audits`: audit jobs + score outputs
- `audit_stages`: stage-by-stage progress
- `audit_metrics`: structured metric outputs
- `audit_findings`: evidence-backed issues
- `technologies`: known technology catalog
- `audit_technologies`: per-audit detections
- `recommendations`: prioritized remediation plan
- `audit_ai_summaries`: AI/fallback summary model
- `subscriptions`: plan and limits
- `notifications`: user notifications

Relationships:

- User owns websites, audits, sessions, subscription
- Audit belongs to user + website
- Findings/metrics/stages/tech/recommendations belong to audit

RLS:

- Policies included in `002_indexes_and_rls.sql`
- Ownership checks enforce `user_id = auth.uid()` where applicable

## 5) Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL` (server-only)
- `NEXT_PUBLIC_APP_URL` (public)
- `SESSION_SECRET` (server-only, min 32 chars)

Optional:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AI_API_KEY`

## 6) Local Development

Run app:

```bash
npm run dev
```

Build test:

```bash
npm run build
```

Type check:

```bash
npm run typecheck
```

## 7) Authentication Setup

Implemented now:

- Email/password register/login/logout
- Forgot/reset password token flow

Google auth:

- Route stub exists at `/api/auth/google`
- Configure OAuth credentials and callback implementation before production launch

Password reset URL:

- `/reset-password?token=<token>`

## 8) AI Configuration

- Optional key: `AI_API_KEY`
- Current implementation includes a deterministic fallback AI-summary layer
- If key is unavailable, audit summary still works using fallback generation

## 9) Scanner Configuration

Audit jobs run through backend service pipeline:

1. URL validation
2. SSRF-safe target checks
3. Fetch + parse HTML
4. SEO/security/accessibility/performance checks
5. Technology detection
6. Deterministic scoring
7. Recommendations + AI summary

Protections:

- Blocks localhost/private ranges/metadata hosts
- Restricts protocol to http/https
- Uses request timeout for fetch

## 10) Development Database Reset

Local PostgreSQL reset example:

```bash
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db -c "drop schema public cascade; create schema public;"
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db -f supabase/migrations/001_initial_schema.sql
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db -f supabase/migrations/002_indexes_and_rls.sql
psql postgresql://postgres:postgres@127.0.0.1:5432/app_db -f supabase/seed/seed.sql
```

## 11) Production Deployment

Recommended: Vercel + Supabase Postgres

- Build command: `npm run build`
- Install command: `npm install`
- Set environment variables from `.env.example`
- Ensure `NEXT_PUBLIC_APP_URL` matches production domain
- Apply migrations before first production run

## 12) Troubleshooting

- **Database connection failure**: verify `DATABASE_URL`
- **Auth redirect issue**: verify `NEXT_PUBLIC_APP_URL`
- **RLS permission issue**: review policies in migration 002
- **Reset password not working**: token may be expired or already used
- **Audit timeout**: target may block bot traffic or respond slowly
- **AI unavailable**: fallback summary should still render

## 13) Project Architecture

- `src/app`: routes, route handlers, layouts
- `src/components`: UI components and app feature components
- `src/lib`: auth/security/analyzer/scoring/utilities
- `src/services`: orchestration services (audit job runner)
- `src/db`: Drizzle DB client + schema
- `supabase/migrations`: SQL migrations
- `supabase/seed`: seed SQL

## 14) First Audit Walkthrough

1. Create database (local Postgres or Supabase)
2. Configure `.env`
3. Apply migrations
4. Start app (`npm run dev`)
5. Register account (`/register`)
6. Open `/audits/new`
7. Submit URL
8. Watch stage progress
9. Open completed report
