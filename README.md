# WEBSITEAUDIT AI

WebsiteAudit AI is a fullstack SaaS web application for technical website intelligence.

It helps developers, agencies, and businesses audit public websites and prioritize what to fix next using:

- Deterministic scoring (not arbitrary AI scoring)
- Evidence-backed findings
- Structured issue tracking
- Technology detection
- AI-assisted explanation layer
- Historical audit reporting

## Main Features

- Marketing site with product positioning and audit preview
- Shared workspace with no login or signup
- Protected app shell with sidebar + mobile drawer
- Command palette (`Cmd/Ctrl + K`)
- New audit workflow (`/audits/new`)
- Async audit jobs with real stage progress
- Audit report (`/audits/[id]`) with:
  - Overall/category scores
  - Findings with why/fix/evidence
  - Performance metrics
  - Technology detection
  - Recommendations
  - AI summary fallback
- Websites list and website detail pages
- Audit history and trend deltas
- Settings and billing scaffolding
- Security-focused URL validation + SSRF protections
- Supabase-ready SQL migrations and seed data

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript (strict)
- Tailwind CSS 4 + custom design tokens
- Drizzle ORM + PostgreSQL
- Lucide icons
- Zod validation
- Cheerio-based HTML analyzer

## Architecture Summary

- `src/app`: routes and layouts
- `src/components`: reusable UI and feature components
- `src/lib`: auth, analyzers, scoring, validation, utils
- `src/services`: audit orchestration service
- `src/db`: Drizzle connection + schema
- `supabase/migrations`: reproducible SQL migrations
- `supabase/seed`: development seed data

## Local Setup

See **[GUIDE.md](./GUIDE.md)** for complete setup steps.

## Development Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Deployment Summary

- Deploy on Vercel (or another Node-compatible platform)
- Set environment variables from `.env.example`
- Point `DATABASE_URL` to managed PostgreSQL/Supabase
- Apply SQL migrations from `supabase/migrations`
- All visitors share the same workspace and data; do not use this mode for private or sensitive audits.

## License

This project is provided for educational/portfolio use. Add your preferred license before production launch.
