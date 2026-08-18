# Motocodex 🇧🇩

A modern, heavily-animated **motorcycle price, specifications & comparison directory for Bangladesh**. Built for performance, SEO, and source-code protection via Server-Side Rendering.

- **Framework:** Next.js 16 (App Router, RSC + SSG)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (mega menu, page transitions, hero)
- **Database:** SQLite via Prisma (swap to PostgreSQL by changing one line)
- **Deploy:** static export to GitHub Pages, or a Dockerised standalone server on **http://localhost:9001**

The seed data currently covers **8 brands and 19 models** (all Yamaha) plus **40 ownership guides**, with prices in **BDT (৳)** and full specs — engine, power, torque, mileage, weight, dimensions, brakes/ABS, suspension and tyres.

> **Dataset status.** The other seven brands are seeded as manufacturers but carry no models yet, so their pages render an empty range. 34 of the 40 guides reference bikes that are not in the catalogue, so those articles render without their linked model. Adding the missing models to `data/seeds/bikes.json` resolves both.

---

## Quick start (Docker — recommended)

```bash
docker compose up --build
```

Then open **http://localhost:9001**. The image builds the production app, creates the SQLite DB, and seeds it from `data/seeds/*.json` at build time — no runtime setup needed.

## Deploy to GitHub Pages

```bash
npm run build:static     # writes ./out
npm run serve:static     # preview it locally
```

Push to `main` and the workflow in `.github/workflows/deploy.yml` builds and
publishes automatically — enable it once under **Settings → Pages → Source →
GitHub Actions**. The workflow derives the URLs from the repository itself, so a
project repo is served from `/<repo>/` and a `<user>.github.io` repo from the
domain root; nothing needs editing by hand.

Building by hand needs both variables, because a project page lives under a path
prefix that must be baked into every asset URL at build time:

```bash
NEXT_PUBLIC_BASE_PATH=/<repo> SITE_URL=https://<user>.github.io/<repo> npm run build:static
```

**What the static target gives up.** GitHub Pages serves files, not a server, so
`npm run build:static` drops the three `/api/*` route handlers and the
middleware in `src/proxy.ts` (both are restored automatically after the build,
and the Docker target still uses them). Navbar search reads a prebuilt
`search-index.json` instead of calling the API, and `/compare` is pre-rendered
for every combination of 2–4 bikes rather than resolved per request.

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
