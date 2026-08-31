# Deployment — Artisan Finder (SD-06)

Backend → **Render** (Node Web Service) · Frontend → **Vercel** (SPA static)

`render.yaml` (backend + optional frontend) and `frontend/vercel.json` are
already in the repo. Below is the exact environment wiring. **Secret values are
entered in the dashboard — never committed.**

> **Current status: the backend runs on a local SQLite store**, not Appwrite
> (Appwrite API-key scopes were never granted). At deploy time you do **not** need
> `APPWRITE_*` vars — only `JWT_SECRET` and `CORS_ORIGIN`. The `/uploads/*` static
> route and SQLite DB are created automatically on boot (`backend/data/`,
> `backend/uploads/`). See the "Local SQLite store" section at the end.

## Render — backend (`artisan-finder-api`)

Set in Render dashboard (for the `sync: false` vars in `render.yaml`):

| Var | Value |
|---|---|
| `CORS_ORIGIN` | the Vercel app URL, e.g. `https://artisan-finder.vercel.app` |

`render.yaml` already provides: `NODE_ENV=production`, `JWT_SECRET` (auto-generated),
`JWT_EXPIRES_IN=7d`. The fixed Appwrite IDs are ignored in local mode.

## Vercel — frontend

`frontend/vercel.json` sets the build (`vite`) and SPA rewrite. In the Vercel
project's **Environment Variables** (Production/Preview/Development), set:

| Var | Value |
|---|---|
| `VITE_API_BASE_URL` | the deployed Render URL, e.g. `https://artisan-finder-api.onrender.com/api` |

> `VITE_*` vars are baked in at build time on Vercel, so they must be set in the
> Vercel dashboard before/at deploy. `VITE_APPWRITE_*` vars are no longer needed.

## Local SQLite store (current)

- **Backend**: `backend/src/db.js` (better-sqlite3) stores documents as JSON rows
  (tables `profiles`, `bookings`, `users`, `files`), auto-migrated on boot.
- **Uploads**: avatar/portfolio images are written to `backend/uploads/` and served
  at `/uploads/*` via `@fastify/static`.
- **Seed demo data** (8 artisans + demo client/artisan): `npm run db:reset`
  - `client@demo.com` / `client123` (client)
  - `artisan@demo.com` / `artisan123` (artisan)
- `backend/data/` and `backend/uploads/` are gitignored.

## Appwrite console — API key scopes required (for later re-enable)

API Keys → the `standard_...` key. Expand **Database** and enable the four
sub-scopes for both **read and write**: **Collections, Attributes, Indexes,
Documents**. Also enable **Buckets** and **Files** (read+write) and **Users**
(read/write). A single "Database: read" tick is **not** sufficient — each
operation (`listCollections`, `listAttributes`, `listIndexes`, documents …)
needs its own scope.

## One-time provisioning (Appwrite only)

After scopes are granted, from `backend/`:

```bash
npm run setup:appwrite   # creates DB/collections/indexes/buckets (idempotent)
```
