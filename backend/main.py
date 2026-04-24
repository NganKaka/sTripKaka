from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    title="sTripKaka Backend API",
    description="REST API for the sTripKaka travel journal.",
    version="1.2.0",
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://s-trip-kaka.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Root
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def read_root():
    return {"status": "sTripKaka API running", "version": "1.2.0"}


# ─────────────────────────────────────────────────────────────────────────────
# Locations
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_node_images(images: Optional[List[str]]) -> List[str]:
    arr = (images or [])[:3]
    if len(arr) < 3:
        arr += [''] * (3 - len(arr))
    return arr


def _build_gallery_nodes(gallery_nodes, gallery_images: Optional[List[str]]):
    if gallery_nodes and isinstance(gallery_nodes, list):
        normalized_nodes = []
        for node in gallery_nodes:
            if not isinstance(node, dict):
                continue
            normalized_nodes.append({
                "title": node.get("title", ""),
                "description": node.get("description", ""),
                "images": _normalize_node_images(node.get("images", [])),
            })
        if normalized_nodes:
            return normalized_nodes

    flat = gallery_images or []
    if not flat:
        return []

    nodes = []
    for i in range(0, len(flat), 3):
        chunk = flat[i:i + 3]
        nodes.append({
            "title": f"Node {len(nodes) + 1}",
            "description": "",
            "images": _normalize_node_images(chunk),
        })
    return nodes


def _normalize_featured_images(featured_images: Optional[List[str]], hero_poster: Optional[str] = None) -> List[str]:
    arr = list((featured_images or [])[:3])
    if hero_poster:
        arr = [hero_poster, *arr]
    normalized = []
    seen = set()
    for item in arr:
        if not item or item in seen:
            continue
        normalized.append(item)
        seen.add(item)
        if len(normalized) == 3:
            break
    while len(normalized) < 3:
        normalized.append('')
    return normalized


def _serialize_location(loc: models.Location):
    data = schemas.LocationOut.model_validate(loc).model_dump()
    data["gallery_nodes"] = _build_gallery_nodes(getattr(loc, "gallery_nodes", None), loc.gallery_images)
    data["featured_images"] = _normalize_featured_images(getattr(loc, "featured_images", None), getattr(loc, "hero_poster", None))
    return data


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
    return [_serialize_location(loc) for loc in query.offset(skip).limit(limit).all()]


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
        "items": [_serialize_location(loc) for loc in items],
        "total": total,
        "has_more": skip + limit < total
    }


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def get_location_by_id(location_id: str, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return _serialize_location(location)


@app.post("/api/locations", response_model=schemas.LocationOut, status_code=201, tags=["Locations"])
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    if db.query(models.Location).filter(models.Location.id == location.id).first():
        raise HTTPException(status_code=400, detail="Location ID already exists")
    payload = location.model_dump()
    payload["gallery_nodes"] = _build_gallery_nodes(payload.get("gallery_nodes"), payload.get("gallery_images"))
    payload["featured_images"] = _normalize_featured_images(payload.get("featured_images"), payload.get("hero_poster"))
    new_location = models.Location(**payload)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return _serialize_location(new_location)


@app.put("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def update_location(location_id: str, payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    payload_data = payload.model_dump()
    payload_data["gallery_nodes"] = _build_gallery_nodes(payload_data.get("gallery_nodes"), payload_data.get("gallery_images"))
    payload_data["featured_images"] = _normalize_featured_images(payload_data.get("featured_images"), payload_data.get("hero_poster"))
    for field, value in payload_data.items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return _serialize_location(loc)


@app.patch("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def patch_location(location_id: str, payload: schemas.LocationPatch, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    payload_data = payload.model_dump(exclude_unset=True)
    if "gallery_nodes" in payload_data or "gallery_images" in payload_data:
        payload_data["gallery_nodes"] = _build_gallery_nodes(payload_data.get("gallery_nodes"), payload_data.get("gallery_images", loc.gallery_images))
    if "featured_images" in payload_data or "hero_poster" in payload_data:
        payload_data["featured_images"] = _normalize_featured_images(payload_data.get("featured_images", getattr(loc, "featured_images", None)), payload_data.get("hero_poster", getattr(loc, "hero_poster", None)))
    for field, value in payload_data.items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return _serialize_location(loc)


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
async def upload_image(request: Request, file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{file.filename}"}


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
