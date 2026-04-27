from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request
from urllib.parse import urlparse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timezone
import hashlib
import os
import re
import shutil
import time
import unicodedata
from uuid import uuid4

import cloudinary
import cloudinary.uploader

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

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
HAS_CLOUDINARY_CONFIG = all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET])

if HAS_CLOUDINARY_CONFIG:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )

# â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://s-trip-kaka.vercel.app",
        "https://www.s-trip-kaka.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3001",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://s-trip-kaka-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def read_root():
    return {"status": "sTripKaka API running", "version": "1.2.0"}


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


def _resolve_asset_url(value: Optional[str], request: Optional[Request] = None) -> Optional[str]:
    if not value:
        return value
    if value.startswith("/uploads/"):
        if request is None:
            return value
        return f"{str(request.base_url).rstrip('/')}{value}"
    parsed = urlparse(value)
    if parsed.scheme and parsed.netloc and parsed.path.startswith("/uploads/"):
        if request is None:
            return value
        return f"{str(request.base_url).rstrip('/')}{parsed.path}"
    return value


def _resolve_gallery_nodes_asset_urls(gallery_nodes, request: Optional[Request] = None):
    normalized_nodes = []
    for node in gallery_nodes or []:
        if not isinstance(node, dict):
            normalized_nodes.append(node)
            continue
        normalized_nodes.append({
            **node,
            "images": [_resolve_asset_url(image, request) for image in _normalize_node_images(node.get("images", []))],
        })
    return normalized_nodes


def _serialize_location(loc: models.Location, aggregate: Optional[Dict[str, float | int]] = None, request: Optional[Request] = None):
    data = schemas.LocationOut.model_validate(loc).model_dump()
    data["img"] = _resolve_asset_url(data.get("img"), request)
    data["hero_video"] = _resolve_asset_url(data.get("hero_video"), request)
    data["hero_poster"] = _resolve_asset_url(data.get("hero_poster"), request)
    data["music_url"] = _resolve_asset_url(data.get("music_url"), request)
    data["gallery_images"] = [_resolve_asset_url(image, request) for image in (data.get("gallery_images") or [])]
    data["gallery_nodes"] = _resolve_gallery_nodes_asset_urls(_build_gallery_nodes(getattr(loc, "gallery_nodes", None), loc.gallery_images), request)
    data["featured_images"] = [_resolve_asset_url(image, request) for image in _normalize_featured_images(getattr(loc, "featured_images", None), getattr(loc, "hero_poster", None))]
    data["average_stars"] = float((aggregate or {}).get("average_stars", 5.0))
    data["total_reviews"] = int((aggregate or {}).get("total_reviews", 0))
    data["is_archived"] = bool(getattr(loc, "is_archived", 0))
    data["archived_at"] = getattr(loc, "archived_at", None)
    return data


def _serialize_locations_with_aggregates(db: Session, locations: List[models.Location], request: Optional[Request] = None):
    aggregates = _get_reviews_aggregate_for_ids(db, [loc.id for loc in locations])
    return [_serialize_location(loc, aggregates.get(loc.id), request) for loc in locations]


def _serialize_location_with_aggregate(db: Session, loc: models.Location, request: Optional[Request] = None):
    aggregate = _get_reviews_aggregate_for_ids(db, [loc.id]).get(loc.id)
    return _serialize_location(loc, aggregate, request)


def _normalize_search_query(search: Optional[str]) -> Optional[str]:
    normalized = (search or "").strip()
    return normalized or None


def _parse_include_archived_flag(value: Optional[str | bool]) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


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


def _filter_archived(query, include_archived: bool):
    if include_archived:
        return query
    return query.filter(models.Location.is_archived == 0)


def _ensure_unique_chapter(db: Session, chapter: str, exclude_location_id: Optional[str] = None):
    query = db.query(models.Location).filter(models.Location.chapter == chapter, models.Location.is_archived == 0)
    if exclude_location_id:
        query = query.filter(models.Location.id != exclude_location_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f"{chapter} is already assigned to another location")


def _ensure_location_exists(db: Session, location_id: str, include_archived: bool = False) -> models.Location:
    query = db.query(models.Location).filter(models.Location.id == location_id)
    query = _filter_archived(query, include_archived)
    location = query.first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


def _normalize_nickname(nickname: Optional[str]) -> str:
    normalized = (nickname or "").strip()
    return normalized or "Guest"


BANNED_COMMENT_WORDS = {
    "cac",
    "cc",
    "cl",
    "cmm",
    "cut",
    "db",
    "deo",
    "dit",
    "ditme",
    "dm",
    "dmm",
    "duma",
    "duima",
    "duime",
    "lon",
    "loz",
    "lz",
    "ml",
    "ngu",
    "occho",
    "sucvat",
    "vl",
    "vloz",
    "vcl",
}

BANNED_COMMENT_PHRASES = {
    "cac lon",
    "con cho",
    "dit me",
    "dit me may",
    "dit may",
    "do ngu",
    "do cho",
    "du ma",
    "du me",
    "mat day",
    "me may",
    "oc cho",
    "suc vat",
    "vo hoc",
    "vo van hoa",
}


def _strip_vietnamese_marks(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return without_marks.replace("Ä‘", "d").replace("Ä", "D")


TOKEN_SPLIT_RE = re.compile(r"(\w+)", re.UNICODE)


def _normalize_comment_token(value: str) -> str:
    lowered = _strip_vietnamese_marks(value.lower())
    return re.sub(r"[^a-z0-9]+", "", lowered)


def _mask_banned_comment_words(comment: str) -> str:
    masked_parts: List[str] = []

    for part in TOKEN_SPLIT_RE.split(comment):
        if not part:
            continue
        if TOKEN_SPLIT_RE.fullmatch(part):
            normalized = _normalize_comment_token(part)
            if normalized in BANNED_COMMENT_WORDS or normalized == "l":
                masked_parts.append("***")
                continue
        masked_parts.append(part)

    masked_comment = "".join(masked_parts)

    for phrase in sorted(BANNED_COMMENT_PHRASES, key=len, reverse=True):
        pattern = re.compile(re.escape(phrase).replace(r"\ ", r"\s+"), re.IGNORECASE)

        def replace_phrase(match: re.Match[str]) -> str:
            original = match.group(0)
            normalized = _normalize_comment_token(original.replace(" ", ""))
            compact_phrase = _normalize_comment_token(phrase.replace(" ", ""))
            return "***" if normalized == compact_phrase else original

        masked_comment = pattern.sub(replace_phrase, masked_comment)

    return masked_comment


def _normalize_comment_or_fail(comment: str) -> str:
    normalized = (comment or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    return _mask_banned_comment_words(normalized)


def _sanitize_review_comment(comment: str) -> str:
    return _mask_banned_comment_words((comment or "").strip())


def _sanitize_review(review: models.Review) -> dict:
    return {
        "id": int(review.id),
        "location_id": review.location_id,
        "stars": int(review.stars),
        "nickname": review.nickname,
        "comment": _sanitize_review_comment(review.comment or ""),
        "created_at": review.created_at,
    }


def _sanitize_reviews(reviews: List[models.Review]) -> List[dict]:
    return [_sanitize_review(review) for review in reviews]



def _validate_stars(stars: int) -> int:
    if stars < 0 or stars > 5:
        raise HTTPException(status_code=400, detail="Stars must be between 0 and 5")
    return stars


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
        "reviews": _sanitize_reviews(reviews),
    }


def _extract_location_gallery_image_set(location: models.Location) -> set[str]:
    nodes = _build_gallery_nodes(getattr(location, "gallery_nodes", None), getattr(location, "gallery_images", None))
    node_images = [img for node in nodes for img in _normalize_node_images(node.get("images", []))]
    featured = _normalize_featured_images(getattr(location, "featured_images", None), getattr(location, "hero_poster", None))
    all_images = [*(location.gallery_images or []), *node_images, *featured, location.img or ""]
    return {img for img in all_images if img}


def _normalize_image_src_or_fail(image_src: str) -> str:
    normalized = (image_src or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="image_src is required")
    return normalized


def _normalize_image_note_comment_or_fail(comment: str) -> str:
    normalized = (comment or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    if len(normalized) > 150:
        raise HTTPException(status_code=400, detail="Comment must be at most 150 characters")
    return _mask_banned_comment_words(normalized)


def _serialize_image_note(note: models.ImageNote):
    return {
        "id": int(note.id),
        "location_id": note.location_id,
        "image_src": note.image_src,
        "nickname": note.nickname,
        "comment": _sanitize_review_comment(note.comment or ""),
        "created_at": note.created_at,
    }


def _build_image_notes_response(db: Session, location_id: str, image_src: str):
    notes = (
        db.query(models.ImageNote)
        .filter(models.ImageNote.location_id == location_id, models.ImageNote.image_src == image_src)
        .order_by(models.ImageNote.created_at.asc(), models.ImageNote.id.asc())
        .all()
    )
    total_notes = len(notes)
    return {
        "total_notes": total_notes,
        "remaining_slots": max(0, 3 - total_notes),
        "notes": [_serialize_image_note(note) for note in notes],
    }


def _build_notification_title(location: models.Location) -> str:
    return f"New comment on {location.name}"


def _build_notification_message(review: models.Review) -> str:
    comment = (review.comment or "").strip()
    short_comment = comment[:120] + ("..." if len(comment) > 120 else "")
    return f"{review.nickname}: {short_comment}"


def _build_image_note_notification_title(location: models.Location) -> str:
    return f"New note on {location.name}"


def _build_image_note_notification_message(note: models.ImageNote) -> str:
    comment = (note.comment or "").strip()
    return comment[:120] + ("..." if len(comment) > 120 else "")


def _serialize_notification(notification: models.Notification):
    return {
        "id": int(notification.id),
        "location_id": notification.location_id,
        "review_id": int(notification.review_id) if notification.review_id is not None else None,
        "image_note_id": int(notification.image_note_id) if notification.image_note_id is not None else None,
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


def _normalize_location_payload(payload: dict, for_patch: bool = False, existing_location: Optional[models.Location] = None) -> dict:
    normalized = dict(payload)

    if not for_patch or "gallery_nodes" in normalized or "gallery_images" in normalized:
        gallery_images = normalized.get("gallery_images") if "gallery_images" in normalized else (existing_location.gallery_images if existing_location else None)
        gallery_nodes = normalized.get("gallery_nodes") if "gallery_nodes" in normalized else (existing_location.gallery_nodes if existing_location else None)
        normalized["gallery_nodes"] = _build_gallery_nodes(gallery_nodes, gallery_images)

    if not for_patch or "featured_images" in normalized or "hero_poster" in normalized:
        featured_images = normalized.get("featured_images") if "featured_images" in normalized else (getattr(existing_location, "featured_images", None) if existing_location else None)
        hero_poster = normalized.get("hero_poster") if "hero_poster" in normalized else (getattr(existing_location, "hero_poster", None) if existing_location else None)
        normalized["featured_images"] = _normalize_featured_images(featured_images, hero_poster)

    if "music_url" in normalized and normalized["music_url"] == "":
        normalized["music_url"] = None

    if "is_archived" in normalized:
        normalized["is_archived"] = 1 if bool(normalized["is_archived"]) else 0

    if "archived_at" in normalized and isinstance(normalized["archived_at"], str) and normalized["archived_at"]:
        normalized["archived_at"] = datetime.fromisoformat(normalized["archived_at"].replace("Z", "+00:00"))

    if "is_archived" in normalized:
        if normalized["is_archived"] and not normalized.get("archived_at"):
            normalized["archived_at"] = datetime.now(timezone.utc)
        if not normalized["is_archived"]:
            normalized["archived_at"] = None

    return normalized


@app.get("/api/locations", response_model=List[schemas.LocationOut], tags=["Locations"])
def get_locations(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    highlight_type: Optional[str] = None,
    chapter: Optional[str] = None,
    search: Optional[str] = None,
    include_archived: Optional[str] = None,
    db: Session = Depends(get_db),
):
    include_archived_flag = _parse_include_archived_flag(include_archived)
    query = _filter_archived(db.query(models.Location), include_archived_flag)
    query = _apply_location_filters(query, highlight_type, chapter, search)
    locations = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()
    return _serialize_locations_with_aggregates(db, locations, request)


@app.get("/api/locations/paginated", response_model=schemas.PaginatedLocations, tags=["Locations"])
def get_locations_paginated(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    highlight_type: Optional[str] = None,
    chapter: Optional[str] = None,
    search: Optional[str] = None,
    include_archived: Optional[str] = None,
    db: Session = Depends(get_db),
):
    include_archived_flag = _parse_include_archived_flag(include_archived)
    query = _filter_archived(db.query(models.Location), include_archived_flag)
    query = _apply_location_filters(query, highlight_type, chapter, search)

    total = query.count()
    items = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()

    return {
        "items": _serialize_locations_with_aggregates(db, items, request),
        "total": total,
        "has_more": skip + limit < total
    }


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def get_location_by_id(request: Request, location_id: str, include_archived: Optional[str] = None, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id, include_archived=_parse_include_archived_flag(include_archived))
    return _serialize_location_with_aggregate(db, location, request)


@app.post("/api/locations", response_model=schemas.LocationOut, status_code=201, tags=["Locations"])
def create_location(request: Request, location: schemas.LocationCreate, db: Session = Depends(get_db)):
    if db.query(models.Location).filter(models.Location.id == location.id).first():
        raise HTTPException(status_code=400, detail="Location ID already exists")
    _ensure_unique_chapter(db, location.chapter)

    payload = _normalize_location_payload(location.model_dump(), for_patch=False)
    new_location = models.Location(**payload)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return _serialize_location_with_aggregate(db, new_location, request)


@app.put("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def update_location(request: Request, location_id: str, payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    _ensure_unique_chapter(db, payload.chapter, exclude_location_id=location_id)

    payload_data = _normalize_location_payload(payload.model_dump(), for_patch=False)
    for field, value in payload_data.items():
        setattr(loc, field, value)

    db.commit()
    db.refresh(loc)
    return _serialize_location_with_aggregate(db, loc, request)


@app.patch("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
def patch_location(request: Request, location_id: str, payload: schemas.LocationPatch, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")

    payload_data = payload.model_dump(exclude_unset=True)
    if "chapter" in payload_data:
        _ensure_unique_chapter(db, payload_data["chapter"], exclude_location_id=location_id)

    payload_data = _normalize_location_payload(payload_data, for_patch=True, existing_location=loc)
    for field, value in payload_data.items():
        setattr(loc, field, value)

    db.commit()
    db.refresh(loc)
    return _serialize_location_with_aggregate(db, loc, request)


@app.delete("/api/locations/{location_id}", status_code=204, tags=["Locations"])
def archive_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    loc.is_archived = 1
    loc.archived_at = datetime.now(timezone.utc)
    db.commit()


@app.post("/api/locations/{location_id}/restore", response_model=schemas.RestoreLocationResponse, tags=["Locations"])
def restore_location(request: Request, location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    loc.is_archived = 0
    loc.archived_at = None
    db.commit()
    db.refresh(loc)
    return schemas.RestoreLocationResponse(location=_serialize_location_with_aggregate(db, loc, request))


@app.get("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def get_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
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
    _ensure_location_exists(db, location_id, include_archived=True)
    review = db.query(models.Review).filter(models.Review.id == review_id, models.Review.location_id == location_id).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return _build_location_reviews_response(db, location_id)


@app.delete("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def delete_all_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
    db.query(models.Review).filter(models.Review.location_id == location_id).delete(synchronize_session=False)
    db.commit()
    return _build_location_reviews_response(db, location_id)


@app.get("/api/locations/{location_id}/image-notes", response_model=schemas.ImageNotesOut, tags=["ImageNotes"])
def get_image_notes(location_id: str, image_src: str, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id, include_archived=True)
    normalized_src = _normalize_image_src_or_fail(image_src)
    if normalized_src not in _extract_location_gallery_image_set(location):
        raise HTTPException(status_code=404, detail="Image not found for this location")
    return _build_image_notes_response(db, location_id, normalized_src)


@app.post("/api/locations/{location_id}/image-notes", response_model=schemas.ImageNotesOut, status_code=201, tags=["ImageNotes"])
def create_image_note(location_id: str, payload: schemas.ImageNoteCreate, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id)
    image_src = _normalize_image_src_or_fail(payload.image_src)
    if image_src not in _extract_location_gallery_image_set(location):
        raise HTTPException(status_code=404, detail="Image not found for this location")

    existing_count = (
        db.query(func.count(models.ImageNote.id))
        .filter(models.ImageNote.location_id == location_id, models.ImageNote.image_src == image_src)
        .scalar()
    ) or 0
    if existing_count >= 3:
        raise HTTPException(status_code=400, detail="This image already has 3 notes (maximum reached)")

    nickname = _normalize_nickname(payload.nickname)
    comment = _normalize_image_note_comment_or_fail(payload.comment)

    note = models.ImageNote(
        location_id=location_id,
        image_src=image_src,
        nickname=nickname,
        comment=comment,
    )
    db.add(note)
    db.flush()

    notification = models.Notification(
        location_id=location_id,
        review_id=None,
        image_note_id=note.id,
        title=_build_image_note_notification_title(location),
        message=_build_image_note_notification_message(note),
        is_read=0,
    )
    db.add(notification)
    db.commit()
    return _build_image_notes_response(db, location_id, image_src)


@app.delete("/api/locations/{location_id}/image-notes/{note_id}", response_model=schemas.ImageNotesOut, tags=["ImageNotes"])
def delete_image_note(location_id: str, note_id: int, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
    note = (
        db.query(models.ImageNote)
        .filter(models.ImageNote.id == note_id, models.ImageNote.location_id == location_id)
        .first()
    )
    if note is None:
        raise HTTPException(status_code=404, detail="Image note not found")
    image_src = note.image_src
    db.delete(note)
    db.commit()
    return _build_image_notes_response(db, location_id, image_src)


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


@app.get("/api/uploads/sign", tags=["Uploads"])
def get_upload_signature(folder: str = "stripkaka"):
    if not HAS_CLOUDINARY_CONFIG:
        raise HTTPException(status_code=503, detail="Cloudinary is not configured")

    timestamp = int(time.time())
    public_id = f"{folder}/{timestamp}_{uuid4().hex[:8]}"
    params_to_sign = {
        "folder": folder,
        "public_id": public_id,
        "timestamp": timestamp,
    }
    signature = cloudinary.utils.api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)
    return {
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY,
        "timestamp": timestamp,
        "folder": folder,
        "public_id": public_id,
        "signature": signature,
    }


@app.post("/api/upload", tags=["Uploads"])
async def upload_image(request: Request, file: UploadFile = File(...)):
    if HAS_CLOUDINARY_CONFIG:
        try:
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="stripkaka",
                use_filename=True,
                unique_filename=True,
            )
            secure_url = upload_result.get("secure_url")
            if not secure_url:
                raise HTTPException(status_code=500, detail="Cloudinary did not return a URL")
            return {"url": secure_url}
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {exc}")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{file.filename}"}


@app.get("/api/stats", response_model=schemas.StatsOut, tags=["Stats"])
def get_stats(db: Session = Depends(get_db)):
    active_locations_query = db.query(models.Location).filter(models.Location.is_archived == 0)
    total_locations = active_locations_query.count()
    locations = active_locations_query.all()
    chapters = list({loc.chapter for loc in locations})

    return schemas.StatsOut(
        total_locations=total_locations,
        total_chapters=len(chapters),
        locations_by_type={
            ht: db.query(func.count(models.Location.id))
                .filter(models.Location.highlight_type == ht, models.Location.is_archived == 0).scalar() or 0
            for ht in ("primary", "secondary", "highlight")
        },
    )
