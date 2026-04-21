from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import shutil

import models
import schemas
from database import engine, get_db

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Voyager Backend API",
    description="REST API for the Voyager personal travel journal.",
    version="1.2.0",
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "uploads")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def read_root():
    return {"status": "Voyager API running", "version": "1.2.0"}


# ─────────────────────────────────────────────────────────────────────────────
# Locations
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/locations", response_model=List[schemas.LocationOut], tags=["Locations"])
def get_locations(
    skip: int = 0,
    limit: int = 100,
    highlight_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Location)
    if highlight_type:
        query = query.filter(models.Location.highlight_type == highlight_type)
    return query.offset(skip).limit(limit).all()


@app.get("/api/locations/paginated", response_model=schemas.PaginatedLocations, tags=["Locations"])
def get_locations_paginated(
    skip: int = 0,
    limit: int = 10,
    highlight_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Location)
    if highlight_type:
        query = query.filter(models.Location.highlight_type == highlight_type)
    
    total = query.count()
    items = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "has_more": skip + limit < total
    }


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def get_location_by_id(location_id: str, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@app.post("/api/locations", response_model=schemas.LocationOut, status_code=201, tags=["Locations"])
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    if db.query(models.Location).filter(models.Location.id == location.id).first():
        raise HTTPException(status_code=400, detail="Location ID already exists")
    new_location = models.Location(**location.model_dump())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


@app.put("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def update_location(location_id: str, payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    for field, value in payload.model_dump().items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return loc


@app.patch("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def patch_location(location_id: str, payload: schemas.LocationPatch, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return loc


@app.delete("/api/locations/{location_id}", status_code=204, tags=["Locations"])
def delete_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Uploads
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/upload", tags=["Uploads"])
async def upload_image(file: UploadFile = File(...)):
    # Create the directory if it doesn't exist
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Secure filename or just use original for now
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"/uploads/{file.filename}"}


# ─────────────────────────────────────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/stats", response_model=schemas.StatsOut, tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    total_locations = db.query(func.count(models.Location.id)).scalar() or 0
    locations = db.query(models.Location).all()
    chapters = list({loc.chapter for loc in locations})

    return schemas.StatsOut(
        total_locations=total_locations,
        total_chapters=len(chapters),
        locations_by_type={
            ht: db.query(func.count(models.Location.id))
                   .filter(models.Location.highlight_type == ht).scalar() or 0
            for ht in ("primary", "secondary", "highlight")
        },
    )
