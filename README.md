# Motocodex 🇧🇩

A modern, heavily-animated **motorcycle price, specifications & comparison directory for Bangladesh**. Built for performance, SEO, and source-code protection via Server-Side Rendering.

- **Framework:** Next.js 14 (App Router, RSC + SSR/SSG)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (mega menu, page transitions, hero)
- **Database:** SQLite via Prisma (swap to PostgreSQL by changing one line)
- **Deploy:** Dockerized, standalone build, exposed on **http://localhost:9001**

The dataset covers **22 brands and 224 currently-available models** in the Bangladesh market, with prices in **BDT (৳)** and full specs — engine, power, torque, mileage, weight, dimensions, brakes/ABS, suspension and tyres.

---

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

Then open **http://localhost:9001**. The image builds the production app, creates the SQLite DB, and seeds it from `data/seeds/*.json` at build time — no runtime setup needed.

## Local development

```bash
npm install
npm run db:setup     # prisma db push + seed from JSON
npm run dev          # http://localhost:9001
```

| Script | Purpose |
| --- | --- |
| `npm run build` | `prisma generate` + production build (standalone) |
| `npm run db:seed` | Re-seed the database from `data/seeds` |

---

## Routing architecture

| Route | Description |
| --- | --- |
| `/` | Animated hero, top categories, featured (most powerful) bikes, brands |
| `/manufacturers` | Index of every brand |
| `/manufacturers/[manufacturer]` | A brand's full model range |
| `/manufacturers/[manufacturer]/[model]` | Individual spec page — **price in BDT + source link at the bottom of the specs** |
| `/find-your-bike` | GSMArena-style finder: sliders for engine CC & price (৳), brand/style toggles, live results |
| `/compare` | Pick 2–4 bikes |
| `/compare/[a-vs-b-vs-c]` | Side-by-side table; best value per row highlighted; supports N bikes via `-vs-` |
| `/news` | News & ownership-guide index |
| `/news/[slug]` | Individual blog article (common problems & fixes), with Article JSON-LD and cited sources |

UI is a **light theme** (white surfaces, orange accent). Bike pages show real product images where available (`public/bikes/*.webp`, human-free) with a generated gradient fallback. Every page sets a canonical URL.

Internal API (server-only, index-blocked via robots): `/api/health`, `/api/bikes?q=`, `/api/manufacturers`.

## Data

`Manufacturer 1—* Bike`. Every `Bike` carries a **required `officialUrl`** linking back to the source listing for that exact model, plus the brand's official site on the manufacturer record. The shipped data lives in `data/seeds/manufacturers.json` and `data/seeds/bikes.json`.

The dataset was gathered from public Bangladesh-market motorcycle listings (motorcyclevalley.com) — researched and normalised into the seed JSON, not scraped live at runtime. To refresh prices, edit the seed JSON and re-run `npm run db:seed` (or rebuild the image). Prices in BD move frequently; treat figures as reference and confirm with dealers.

## Source-code protection

- All database access funnels through `src/lib/queries.ts`, imported **only** from Server Components / Route Handlers. Prisma, the schema shape, and raw queries are never serialised into client bundles.
- `output: "standalone"` ships a minimal compiled server — no readable application source in the runtime image.
- `removeConsole` strips logs from production client bundles; `@prisma/client` is externalised from the client.

## Switching to PostgreSQL

1. In `prisma/schema.prisma` set `provider = "postgresql"`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. Add a `postgres` service to `docker-compose.yml` and point `DATABASE_URL` at it.
4. `npm run db:setup`.
