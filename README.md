# Cerebre Intelligence Platform — Pro Enterprise

AI-powered marketing intelligence platform for corporations.

## Quick Deploy

See **Cerebre-Complete-Deployment-Guide.html** — full step-by-step guide for beginners.

## Quick start (local)

```bash
cd backend && npm install
cd ../frontend && npm install
cp backend/.env.example backend/.env  # fill in values
docker compose up --build
docker compose exec backend node src/db/db.js migrate
docker compose exec backend node src/db/seed.js
# Open http://localhost:3000  |  demo@cerebre.media / demo1234
```

## Database setup (Supabase SQL Editor — run in this order)

1. `backend/src/db/schema.sql`
2. `backend/src/db/schema_v2.sql`
3. `backend/src/db/schema_enterprise.sql`
4. `backend/src/db/schema_pro.sql`
5. `backend/src/db/schema_extended.sql`

## Required environment variables (Railway)

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → URI |
| `REDIS_URL` | Upstash → Database → Details |
| `JWT_SECRET` | Make up 40+ random chars |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 → API Tokens |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 → API Tokens |
| `S3_BUCKET_NAME` | `cerebre-media-files` |
| `S3_ENDPOINT` | `https://[account-id].r2.cloudflarestorage.com` |
| `AWS_REGION` | `auto` |
| `FRONTEND_URL` | Your Vercel URL (add after Step 8) |

## Tech stack

Next.js 14 · Express · Anthropic Claude · Tesseract OCR · PostgreSQL · Redis · Cloudflare R2 · Docker

## Features (42 total)

Dashboard · Executive View · Ask Your Data · Upload Reports · Reports · Platforms · History ·
Priority Goals · Campaigns · Scorecards · Content Calendar · Brand Health · Share of Voice ·
AI Search Visibility · Digital Maturity · Benchmarks · Cultural Moments Calendar · Geo Intelligence ·
ROI Calculator · Spend Heatmap · Budget Optimiser · UTM Builder · CRM (Salesforce/HubSpot) ·
Attribution Modeling · First-Party Signals · Report Builder · Board Deck · Weekly Digest ·
Predictive Analytics · A/B Experiments · Influencer Tracker · Smart Automations ·
Brand Voice Guardian · Team Tasks · Document Library · Audience Personas · Admin Panel · more
