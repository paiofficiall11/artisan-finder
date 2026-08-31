# Project Tracker — Artisan Finder App (SD-06)

| Phase | Task | Status | Notes |
|---|---|---|---|
| 0 | Repo scaffold | Done | Monorepo at ~/Desktop/artisan-finder; Fastify backend + Vite/React18/TS/Tailwind v4 frontend; local git initialized, 2 atomic commits |
| 0 | Appwrite project created | Done | fra.cloud.appwrite.io, project 6a95c9c8001fb6fc642a; API key supplied by owner |
| 1 | setup-appwrite.js provisioning | In Progress | Script written; DB created; blocked: API key missing collections/attributes/indexes/documents/buckets/files/users scopes — owner updating key |
| 2 | Backend auth routes | In Progress | Code complete (register/login/me, JWT, rate limit); verification pending Appwrite scopes |
| 2 | Backend profile routes | In Progress | Code complete (search/update/avatar/portfolio); verification pending |
| 2 | Backend booking routes | In Progress | Code complete (state machine, 409 transitions); verification pending |
| 3 | Frontend auth pages | In Progress | Code complete (Home/Login/Register, AuthContext, ProtectedRoute); browser verification pending backend |
| 3 | Frontend search/profile pages | In Progress | Code complete (Search w/ debounce+pagination, ArtisanDetail, BookArtisan); verification pending |
| 3 | Frontend booking + dashboards | In Progress | Code complete (both dashboards, ProfileEdit, uploads); verification pending |
| 4 | Full journey integration test | Not Started | |
| 5 | Render backend deploy | Not Started | render.yaml blueprint written (web service, /api/health check) |
| 5 | Render frontend deploy | Not Started | |
| 6 | README | Not Started | |
| 6 | Demo video | Not Started | |
