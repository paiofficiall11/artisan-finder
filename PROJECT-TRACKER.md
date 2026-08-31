# Project Tracker — Artisan Finder App (SD-06)

> **Pivoted data layer (local SQLite for now).** Appwrite API-key scopes
> (documentsdb collections/documents) were never granted, blocking all
> document/storage operations. Per owner instruction, the backend now runs on a
> **local SQLite JSON-document store** (`backend/src/db.js` + better-sqlite3) with
> local file uploads, exposing the exact same facade the services already use.
> Appwrite wiring is left intact so it can be re-enabled later.

| Phase | Task | Status | Notes |
|---|---|---|---|
| 0 | Repo scaffold | Done | Monorepo at ~/Desktop/artisan-finder; Fastify backend + Vite/React18/TS/Tailwind v4 frontend; local git initialized, 2 atomic commits |
| 0 | Appwrite project created | Done | fra.cloud.appwrite.io, project 6a95c9c8001fb6fc642a; API key supplied by owner — **scopes still missing, Appwrite on hold** |
| 1 | Local SQLite store | Done | backend/src/db.js (better-sqlite3) + appwrite.service.js facade rewrite; tables profiles/bookings/users/files auto-migrated on boot; Query re-evaluation for node-appwrite builders |
| 1 | Local uploads | Done | Files written to backend/uploads/{avatars,portfolio}; served via @fastify/static at /uploads/*; frontend storage.ts repointed to backend |
| 1 | Seed / reset | Done | npm run db:reset seeds 8 artisans + demo client (client@demo.com/client123) + demo artisan (artisan@demo.com/artisan123) |
| 2 | Backend auth routes | Done | Verified live on SQLite: register 201, duplicate 409, login 200/401, /auth/me |
| 2 | Backend profile routes | Done | Verified live: search (category/city/keyword), getArtisan, avatar upload + /uploads serve |
| 2 | Backend booking routes | Done | Verified live: create, /bookings/mine w/ client profile, accept/cancel, 409 illegal transition |
| 3 | Frontend auth pages | Done | Code complete (Home/Login/Register, AuthContext, ProtectedRoute); backend now testable end-to-end on SQLite |
| 3 | Frontend search/profile pages | Done | Code complete (Search w/ debounce+pagination, ArtisanDetail, BookArtisan) |
| 3 | Frontend booking + dashboards | Done | Code complete (both dashboards, ProfileEdit, uploads) |
| 3 | Live booking progress | Done | BookingProgress stepper + BookingDetail page with 4s polling; routed at /bookings/:id; tsc + oxlint clean |
| 3 | Motion/polish pass | Done | CSS animation system + Reveal component applied app-wide; respects reduced-motion; tsc clean, oxlint no new warnings |
| 4 | Full journey integration test | Done | backend npm test: 14/14 passing against SQLite-backed store; server.js exports buildApp() |
| 5 | Render backend deploy | In Progress | render.yaml finalized; **note**: render.yaml still references Appwrite envs — update env mapping to local/sqlite (no external DB needed) before deploy |
| 5 | Vercel frontend deploy | In Progress | frontend/vercel.json + .node-version + engine pinned added; VITE_API_BASE_URL must point at deployed Render URL |
| 6 | README | Not Started | |
| 6 | Demo video | Not Started | |
