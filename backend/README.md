# Voyager Backend — Setup Guide

## Prerequisites

- Python 3.11+  
- PostgreSQL running locally  
- Database named `voyager_db` created

```sql
-- Run once in psql
CREATE DATABASE voyager_db;
```

## Installation

```powershell
cd d:\Vibecode\sTripKaka\backend

# Create & activate venv
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

## Run the backend

```powershell
# From backend directory (venv active)
uvicorn main:app --reload --port 8000
```

## Seed the database (first time only)

```powershell
python seed.py
```

## API Docs

Visit http://localhost:8000/docs for the interactive Swagger UI.

---

## API Endpoints

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations (`?highlight_type=primary`) |
| GET | `/api/locations/{id}` | Get single location |
| POST | `/api/locations` | Create new location |
| PUT | `/api/locations/{id}` | Full update |
| PATCH | `/api/locations/{id}` | Partial update |
| DELETE | `/api/locations/{id}` | Delete location |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get single user |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Full update |
| PATCH | `/api/users/{id}` | Partial update (auto-recalculates rank) |
| DELETE | `/api/users/{id}` | Delete user |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Aggregated statistics |

## Rank System (auto-calculated on PATCH `/api/users/{id}`)

| Points | Rank |
|--------|------|
| 0 – 999 | Bronze |
| 1000 – 2999 | Silver |
| 3000 – 4999 | Gold |
| 5000+ | Platinum |
