# sTripKaka

Travel journal app with a React frontend and a FastAPI backend for managing destination content.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Assets: static images and videos served from `public/`

## Project Structure

```text
sTripKaka/
|- src/        # frontend app
|- public/     # static media
|- backend/    # FastAPI API + database layer
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL running locally or a reachable PostgreSQL instance

## Environment

Frontend reads `VITE_API_BASE_URL`. If it is not set, the app defaults to:

```env
http://localhost:8000/api
```

Backend uses `DATABASE_URL`. If it is not set, it falls back to:

```env
postgresql://postgres:postgres@localhost:5432/stripkaka_db
```

You can create a project-level `.env` with:

```env
VITE_API_BASE_URL=http://localhost:8000/api
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stripkaka_db
```

## Run Frontend

From the project root:

```powershell
yarn install
yarn dev
```

Frontend runs on `http://localhost:3000`.

Quick start:

1. Open a terminal at the project root.
2. Run `yarn install` once to install dependencies.
3. Run `yarn dev` to start the frontend.
4. Open `http://localhost:3000` in your browser.

## Run Backend

From `backend/`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs will be available at `http://localhost:8000/docs`.

## Seed Sample Data

From `backend/` with the virtual environment active:

```powershell
python seed.py
```

This seeds the sample destinations currently used by the UI, such as `phu_quoc` and `hue`.

## Deploy Notes

- Vercel is a good fit for the frontend.
- The FastAPI backend should be deployed separately to a Python host such as Render or Railway.
- The database should be deployed separately to a managed PostgreSQL provider such as Neon, Supabase, Render Postgres, or Railway Postgres.
- After backend deploy, set Vercel env `VITE_API_BASE_URL` to your backend URL, for example `https://your-backend.example.com/api`.

## Useful Commands

From the project root:

```powershell
yarn dev
yarn build
yarn lint
```

From `backend/`:

```powershell
python check_db.py
python seed.py
```
