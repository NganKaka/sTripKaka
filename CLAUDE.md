# Project Guidelines (CLAUDE.md)

## Token Efficiency Rules
- **Minimal Scanning**: Do not read the entire project. Only access files explicitly mentioned or directly relevant to the current task.
- **Ignore Assets**: Skip images, fonts, and large static assets.
- **Concise Responses**: Provide code snippets only for changed parts. Avoid reprinting the entire file unless requested.

## Technical Stack
- **Backend**: FastAPI (Python) / Node.js (như trong ảnh của bạn).
- **Package Manager**: Yarn.
- **Database**: PostgreSQL/MongoDB (tùy theo project của bạn).

## Coding Preferences
- Use Type Hints for Python (FastAPI).
- Use ES6+ syntax for JavaScript.
- Prioritize modularity and clean architecture.

## Interaction Protocol
- Always ask for clarification before modifying multiple files.
- If a task involves a file not in context, ask me to provide it instead of scanning.
- Summarize changes briefly after providing code.

## Project Summary
- Frontend uses React + Vite + Tailwind + Framer Motion, mounted through `src/main.tsx` with `BrowserRouter`.
- Routing is handled centrally in `src/App.tsx` by mapping pathname to views: Dashboard, Archives, Gallery, Trip Detail, Admin, and Stats placeholder.
- Landing page logic lives in `src/components/Dashboard.tsx`, including hero, map section, metrics, and recent chapters.
- Map rendering lives in `src/components/InteractiveMap.tsx` using MapLibre, fed by `/api/locations`, with marker popups linking to mission detail.
- Archive browsing lives in `src/components/Archives.tsx` with filter, search, and paginated fetch from `/api/locations/paginated`.
- Mission detail lives in `src/components/TripDetail.tsx`, fetching one location from `/api/locations/:id` and rendering markdown story content plus gallery preview.
- Full gallery and reviews live in `src/components/GalleryView.tsx`, including image modal, review submission, review list, and review-target scrolling.
- Admin tooling lives in `src/components/AdminPanel.tsx`, including location CRUD, archive/restore, gallery node editing, markdown editing, Cloudinary upload flow, and review moderation.
- Navbar and footer are in `src/components/Navbar.tsx` and `src/components/Footer.tsx`; navbar also handles notification polling and quick navigation.
- Backend uses FastAPI + SQLAlchemy + PostgreSQL, centered in `backend/main.py` with models in `backend/models.py`, schemas in `backend/schemas.py`, and DB session setup in `backend/database.py`.
- Core backend features include location CRUD, archive/restore, paginated listing, review CRUD, notifications, upload signing/upload, and aggregate stats.
- Seed and local helper scripts exist in `backend/seed.py`, `backend/check_db.py`, `backend/proxy_provider.py`, `backend/gemini_service.py`, and `backend/gemini_proxy.py`.

## Files and Areas Intentionally Not Read
- `node_modules/`
- `backend/venv/`
- `dist/`
- `public/` static assets such as images and videos
- `.git/`
- lockfiles like `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml`
- `.env*` files and local environment secrets
- large generated, dependency, OS, IDE, and log files excluded by `.claudignore`

## Notes About Scope
- This summary was based on reading the main handwritten application and backend source files, not vendored dependencies or generated assets.
- The repository includes static media and generated output that were intentionally skipped for token efficiency and because they are not authoritative for application logic.