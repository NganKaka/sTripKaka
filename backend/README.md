# sTripKaka Backend - Setup Guide

## Prerequisites

- Python 3.11+
- PostgreSQL running locally
- Database named `stripkaka_db` created

```sql
CREATE DATABASE stripkaka_db;
```

## Installation

```powershell
cd d:\Vibecode\sTripKaka\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment

Create a `.env` file in `backend/` or at the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stripkaka_db
```

## Run the Backend

```powershell
uvicorn main:app --reload --port 8000
```

## Seed the Database

```powershell
python seed.py
```

## API Docs

Visit `http://localhost:8000/docs`.

## API Endpoints

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations |
| GET | `/api/locations/paginated` | List locations with pagination |
| GET | `/api/locations/{id}` | Get a single location |
| POST | `/api/locations` | Create a location |
| PUT | `/api/locations/{id}` | Replace a location |
| PATCH | `/api/locations/{id}` | Update part of a location |
| DELETE | `/api/locations/{id}` | Delete a location |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload an image into `public/uploads` |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get aggregated location statistics |
