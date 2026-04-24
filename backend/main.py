from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
import os
import shutil

import models
import schemas
from database import engine, get_db

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


def _get_reviews_aggregate_for_ids(db: Session, location_ids: List[str]) -> Dict[str, Dict[str, float | int]]:
    if not location_ids:
        return {}
    rows = (
        db.query(
            models.Review.location_id,
            func.avg(models.Review.stars).label("average_stars"),
            func.count(models.Review.id).label("total_reviews"),
        )
        .filter(models.Review.location_id.in_(location_ids))
        .group_by(models.Review.location_id)
        .all()
    )
    return {
        row.location_id: {
            "average_stars": float(row.average_stars) if row.average_stars is not None else 5.0,
            "total_reviews": int(row.total_reviews or 0),
        }
        for row in rows
    }


def _serialize_location(loc: models.Location, aggregate: Optional[Dict[str, float | int]] = None):
    data = schemas.LocationOut.model_validate(loc).model_dump()
    data["gallery_nodes"] = _build_gallery_nodes(getattr(loc, "gallery_nodes", None), loc.gallery_images)
    data["featured_images"] = _normalize_featured_images(getattr(loc, "featured_images", None), getattr(loc, "hero_poster", None))
    data["average_stars"] = float((aggregate or {}).get("average_stars", 5.0))
    data["total_reviews"] = int((aggregate or {}).get("total_reviews", 0))
    return data


def _build_location_reviews_response(db: Session, location_id: str):
    reviews = (
        db.query(models.Review)
        .filter(models.Review.location_id == location_id)
        .order_by(models.Review.created_at.desc(), models.Review.id.desc())
        .all()
    )
    total_reviews = len(reviews)
    average_stars = float(sum(review.stars for review in reviews) / total_reviews) if total_reviews else 5.0
    return {
        "average_stars": average_stars,
        "total_reviews": total_reviews,
        "reviews": reviews,
    }


def _build_notification_title(location: models.Location) -> str:
    return f"New comment on {location.name}"


def _build_notification_message(review: models.Review) -> str:
    comment = (review.comment or "").strip()
    short_comment = comment[:120] + ("..." if len(comment) > 120 else "")
    return f"{review.nickname}: {short_comment}"


def _serialize_notification(notification: models.Notification):
    return {
        "id": int(notification.id),
        "location_id": notification.location_id,
        "review_id": int(notification.review_id),
        "title": notification.title,
        "message": notification.message,
        "is_read": bool(notification.is_read),
        "created_at": notification.created_at,
    }


def _build_notifications_response(db: Session, limit: int = 30):
    notifications = (
        db.query(models.Notification)
        .order_by(models.Notification.created_at.desc(), models.Notification.id.desc())
        .limit(limit)
        .all()
    )
    unread_count = db.query(func.count(models.Notification.id)).filter(models.Notification.is_read == 0).scalar() or 0
    return {
        "unread_count": int(unread_count),
        "notifications": [_serialize_notification(notification) for notification in notifications],
    }


def _normalize_nickname(nickname: Optional[str]) -> str:
    normalized = (nickname or "").strip()
    return normalized or "Guest"


def _normalize_comment_or_fail(comment: str) -> str:
    normalized = (comment or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    return normalized


def _validate_stars(stars: int) -> int:
    if stars < 0 or stars > 5:
        raise HTTPException(status_code=400, detail="Stars must be between 0 and 5")
    return stars


def _ensure_location_exists(db: Session, location_id: str) -> models.Location:
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


def _normalize_search_query(search: Optional[str]) -> Optional[str]:
    normalized = (search or "").strip()
    return normalized or None


def _apply_location_filters(query, highlight_type: Optional[str] = None, chapter: Optional[str] = None, search: Optional[str] = None):
    if highlight_type:
        query = query.filter(models.Location.highlight_type == highlight_type)
    if chapter:
        query = query.filter(models.Location.chapter == chapter)
    normalized_search = _normalize_search_query(search)
    if normalized_search:
        like_term = f"%{normalized_search}%"
        query = query.filter(
            models.Location.name.ilike(like_term) |
            models.Location.short_desc.ilike(like_term) |
            models.Location.full_description.ilike(like_term)
        )
    return query


def _ensure_unique_chapter(db: Session, chapter: str, exclude_location_id: Optional[str] = None):
    query = db.query(models.Location).filter(models.Location.chapter == chapter)
    if exclude_location_id:
        query = query.filter(models.Location.id != exclude_location_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f"{chapter} is already assigned to another location")


def _serialize_locations_with_aggregates(db: Session, locations: List[models.Location]):
    aggregates = _get_reviews_aggregate_for_ids(db, [loc.id for loc in locations])
    return [_serialize_location(loc, aggregates.get(loc.id)) for loc in locations]


def _serialize_location_with_aggregate(db: Session, loc: models.Location):
    aggregate = _get_reviews_aggregate_for_ids(db, [loc.id]).get(loc.id)
    return _serialize_location(loc, aggregate)


@app.get("/api/locations", response_model=List[schemas.LocationOut], tags=["Locations"])
def get_locations(
    skip: int = 0,
    limit: int = 100,
    highlight_type: Optional[str] = None,
    chapter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _apply_location_filters(db.query(models.Location), highlight_type, chapter, search)
    locations = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()
    return _serialize_locations_with_aggregates(db, locations)


@app.get("/api/locations/paginated", response_model=schemas.PaginatedLocations, tags=["Locations"])
def get_locations_paginated(
    skip: int = 0,
    limit: int = 10,
    highlight_type: Optional[str] = None,
    chapter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = _apply_location_filters(db.query(models.Location), highlight_type, chapter, search)

    total = query.count()
    items = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()

    return {
        "items": _serialize_locations_with_aggregates(db, items),
        "total": total,
        "has_more": skip + limit < total
    }


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def get_location_by_id(location_id: str, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id)
    return _serialize_location_with_aggregate(db, location)


@app.post("/api/locations", response_model=schemas.LocationOut, status_code=201, tags=["Locations"])
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    if db.query(models.Location).filter(models.Location.id == location.id).first():
        raise HTTPException(status_code=400, detail="Location ID already exists")
    _ensure_unique_chapter(db, location.chapter)
    payload = location.model_dump()
    payload["gallery_nodes"] = _build_gallery_nodes(payload.get("gallery_nodes"), payload.get("gallery_images"))
    payload["featured_images"] = _normalize_featured_images(payload.get("featured_images"), payload.get("hero_poster"))
    new_location = models.Location(**payload)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return _serialize_location_with_aggregate(db, new_location)


@app.put("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def update_location(location_id: str, payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    _ensure_unique_chapter(db, payload.chapter, exclude_location_id=location_id)
    payload_data = payload.model_dump()
    payload_data["gallery_nodes"] = _build_gallery_nodes(payload_data.get("gallery_nodes"), payload_data.get("gallery_images"))
    payload_data["featured_images"] = _normalize_featured_images(payload_data.get("featured_images"), payload_data.get("hero_poster"))
    for field, value in payload_data.items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return _serialize_location_with_aggregate(db, loc)


@app.patch("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def patch_location(location_id: str, payload: schemas.LocationPatch, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    payload_data = payload.model_dump(exclude_unset=True)
    if "chapter" in payload_data:
        _ensure_unique_chapter(db, payload_data["chapter"], exclude_location_id=location_id)
    if "gallery_nodes" in payload_data or "gallery_images" in payload_data:
        payload_data["gallery_nodes"] = _build_gallery_nodes(payload_data.get("gallery_nodes"), payload_data.get("gallery_images", loc.gallery_images))
    if "featured_images" in payload_data or "hero_poster" in payload_data:
        payload_data["featured_images"] = _normalize_featured_images(payload_data.get("featured_images", getattr(loc, "featured_images", None)), payload_data.get("hero_poster", getattr(loc, "hero_poster", None)))
    for field, value in payload_data.items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return _serialize_location_with_aggregate(db, loc)


@app.delete("/api/locations/{location_id}", status_code=204, tags=["Locations"])
def delete_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()


@app.get("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def get_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id)
    return _build_location_reviews_response(db, location_id)


@app.post("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, status_code=201, tags=["Reviews"])
def create_location_review(location_id: str, payload: schemas.ReviewCreate, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id)

    stars = _validate_stars(payload.stars)
    nickname = _normalize_nickname(payload.nickname)
    comment = _normalize_comment_or_fail(payload.comment)

    review = models.Review(
        location_id=location_id,
        stars=stars,
        nickname=nickname,
        comment=comment,
    )
    db.add(review)
    db.flush()

    notification = models.Notification(
        location_id=location_id,
        review_id=review.id,
        title=_build_notification_title(location),
        message=_build_notification_message(review),
        is_read=0,
    )
    db.add(notification)
    db.commit()

    return _build_location_reviews_response(db, location_id)


@app.delete("/api/locations/{location_id}/reviews/{review_id}", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def delete_location_review(location_id: str, review_id: int, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id)
    review = db.query(models.Review).filter(models.Review.id == review_id, models.Review.location_id == location_id).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return _build_location_reviews_response(db, location_id)


@app.delete("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def delete_all_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id)
    db.query(models.Review).filter(models.Review.location_id == location_id).delete(synchronize_session=False)
    db.commit()
    return _build_location_reviews_response(db, location_id)


@app.get("/api/notifications", response_model=schemas.NotificationsOut, tags=["Notifications"])
def get_notifications(limit: int = 30, db: Session = Depends(get_db)):
    normalized_limit = max(1, min(limit, 100))
    return _build_notifications_response(db, normalized_limit)


@app.post("/api/notifications/read-all", response_model=schemas.NotificationsOut, tags=["Notifications"])
def mark_notifications_read(limit: int = 30, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.is_read == 0).update({models.Notification.is_read: 1}, synchronize_session=False)
    db.commit()
    normalized_limit = max(1, min(limit, 100))
    return _build_notifications_response(db, normalized_limit)


@app.delete("/api/notifications/{notification_id}", status_code=204, tags=["Notifications"])
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()


@app.delete("/api/notifications", status_code=204, tags=["Notifications"])
def delete_all_notifications(db: Session = Depends(get_db)):
    db.query(models.Notification).delete(synchronize_session=False)
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
