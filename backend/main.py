from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request, Response
from urllib.parse import urlparse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict, deque
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
from chatbot import ChatbotMessageRequest, ChatbotMessageResponse, ChatbotPreferences, ChatbotResponse, generate_chat_response, generate_recommendations
from database import engine, get_db
from services.weather import fetch_weather

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

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 6
_RATE_LIMITER_BUCKETS: dict[str, deque[float]] = defaultdict(deque)

# Review-aggregate TTL cache: maps tuple(sorted location_ids) -> (expires_at, {id: aggregate}).
REVIEW_AGG_TTL = 60.0
_REVIEW_AGG_CACHE: dict[tuple, tuple[float, Dict[str, Dict[str, float | int]]]] = {}
_REVIEW_AGG_HITS = 0
_REVIEW_AGG_MISSES = 0


def _client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for", "")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip() or "unknown"
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request, scope: str, location_id: str):
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    bucket_key = f"{_client_ip(request)}|{scope}|{location_id}"
    bucket = _RATE_LIMITER_BUCKETS[bucket_key]
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait and try again.")
    bucket.append(now)
    if len(_RATE_LIMITER_BUCKETS) > 1024:
        # Drop buckets that have aged out of their window so the dict can't grow unbounded.
        for stale_key in [key for key, b in _RATE_LIMITER_BUCKETS.items() if not b or b[-1] < window_start]:
            _RATE_LIMITER_BUCKETS.pop(stale_key, None)


if HAS_CLOUDINARY_CONFIG:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )

# â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.add_middleware(GZipMiddleware, minimum_size=1024)
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


@app.middleware("http")
async def server_timing_middleware(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.1f}"
    return response


_PROCESS_STARTED_AT = time.time()


def _set_public_cache(response: Response, max_age: int = 60, swr: int = 300):
    response.headers["Cache-Control"] = f"public, max-age={max_age}, stale-while-revalidate={swr}"


def _set_no_store(response: Response):
    response.headers["Cache-Control"] = "private, no-store"


@app.get("/", tags=["Health"])
def read_root():
    return {"status": "sTripKaka API running", "version": "1.2.0"}


@app.get("/api/_debug/stats", tags=["Health"])
def debug_stats(request: Request, response: Response):
    """Internal observability: cache hit rates, DB pool, rate-limiter sizes, uptime.
    Requires DEBUG_STATS_TOKEN env var; pass via ?token= or X-Debug-Token header."""
    expected = os.getenv("DEBUG_STATS_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=404, detail="Not found")
    provided = request.query_params.get("token") or request.headers.get("x-debug-token", "")
    if provided != expected:
        raise HTTPException(status_code=404, detail="Not found")

    _set_no_store(response)
    pool = engine.pool
    total_lookups = _REVIEW_AGG_HITS + _REVIEW_AGG_MISSES
    hit_rate = (_REVIEW_AGG_HITS / total_lookups) if total_lookups else 0.0
    return {
        "uptime_seconds": int(time.time() - _PROCESS_STARTED_AT),
        "review_aggregate_cache": {
            "size": len(_REVIEW_AGG_CACHE),
            "hits": _REVIEW_AGG_HITS,
            "misses": _REVIEW_AGG_MISSES,
            "hit_rate": round(hit_rate, 3),
            "ttl_seconds": REVIEW_AGG_TTL,
        },
        "rate_limiter": {
            "review_buckets": len(_RATE_LIMITER_BUCKETS),
        },
        "db_pool": {
            "size": getattr(pool, "size", lambda: None)() if callable(getattr(pool, "size", None)) else None,
            "checked_in": getattr(pool, "checkedin", lambda: None)() if callable(getattr(pool, "checkedin", None)) else None,
            "checked_out": getattr(pool, "checkedout", lambda: None)() if callable(getattr(pool, "checkedout", None)) else None,
            "overflow": getattr(pool, "overflow", lambda: None)() if callable(getattr(pool, "overflow", None)) else None,
        },
    }


def _normalize_node_images(images: Optional[List[str]]) -> List[str]:
    arr = (images or [])[:3]
    if len(arr) < 3:
        arr += [''] * (3 - len(arr))
    return arr


def _normalize_node_image_tags(image_tags: Optional[List[List[str]]]) -> List[List[str]]:
    normalized = []
    for tags in (image_tags or [])[:3]:
        if isinstance(tags, list):
            normalized.append([tag.strip() for tag in tags if isinstance(tag, str) and tag.strip()])
        else:
            normalized.append([])
    if len(normalized) < 3:
        normalized += [[] for _ in range(3 - len(normalized))]
    return normalized


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
                "image_tags": _normalize_node_image_tags(node.get("image_tags", [])),
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
            "image_tags": _normalize_node_image_tags([]),
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
    global _REVIEW_AGG_HITS, _REVIEW_AGG_MISSES
    if not location_ids:
        return {}
    cache_key = tuple(sorted(location_ids))
    now = time.time()
    cached = _REVIEW_AGG_CACHE.get(cache_key)
    if cached is not None and cached[0] > now:
        _REVIEW_AGG_HITS += 1
        return cached[1]
    _REVIEW_AGG_MISSES += 1

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
    result = {
        row.location_id: {
            "average_stars": float(row.average_stars) if row.average_stars is not None else 5.0,
            "total_reviews": int(row.total_reviews or 0),
        }
        for row in rows
    }
    _REVIEW_AGG_CACHE[cache_key] = (now + REVIEW_AGG_TTL, result)
    if len(_REVIEW_AGG_CACHE) > 256:
        # Best-effort eviction — drop the oldest entry by expiry.
        oldest = min(_REVIEW_AGG_CACHE, key=lambda k: _REVIEW_AGG_CACHE[k][0])
        _REVIEW_AGG_CACHE.pop(oldest, None)
    return result


def _invalidate_review_aggregates():
    _REVIEW_AGG_CACHE.clear()


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


async def _attach_weather(data: dict, loc: models.Location) -> dict:
    """Async weather enrichment for single-location responses only."""
    try:
        weather = await fetch_weather(loc.lat, loc.lng)
        if weather is not None:
            data["ambient"] = {
                "weather": {
                    "condition": weather.condition,
                    "temperature_c": weather.temperature_c,
                    "is_day": weather.is_day,
                    "source": weather.source,
                    "fetched_at": weather.fetched_at,
                    "stale": weather.stale,
                }
            }
    except Exception:
        pass  # Never let weather break the location response
    return data


def _serialize_locations_with_aggregates(db: Session, locations: List[models.Location], request: Optional[Request] = None):
    aggregates = _get_reviews_aggregate_for_ids(db, [loc.id for loc in locations])
    return [_serialize_location(loc, aggregates.get(loc.id), request) for loc in locations]


def _serialize_location_slim(loc: models.Location, aggregate: Optional[Dict[str, float | int]] = None, request: Optional[Request] = None):
    """Slim payload for list endpoints — skips heavy fields and weather."""
    nodes = getattr(loc, "gallery_nodes", None) or []
    node_image_count = 0
    if isinstance(nodes, list):
        for node in nodes:
            if isinstance(node, dict):
                node_image_count += sum(1 for img in (node.get("images") or []) if img)
    flat_image_count = sum(1 for img in (loc.gallery_images or []) if img)
    image_count = node_image_count or flat_image_count

    return {
        "id": loc.id,
        "name": loc.name,
        "chapter": loc.chapter,
        "short_desc": loc.short_desc,
        "img": _resolve_asset_url(loc.img, request),
        "visited_date": loc.visited_date,
        "highlight_type": loc.highlight_type,
        "lat": loc.lat,
        "lng": loc.lng,
        "full_description": loc.full_description,
        "average_stars": float((aggregate or {}).get("average_stars", 5.0)),
        "total_reviews": int((aggregate or {}).get("total_reviews", 0)),
        "is_archived": bool(getattr(loc, "is_archived", 0)),
        "archived_at": getattr(loc, "archived_at", None),
        "image_count": image_count,
    }


def _serialize_locations_slim(db: Session, locations: List[models.Location], request: Optional[Request] = None):
    aggregates = _get_reviews_aggregate_for_ids(db, [loc.id for loc in locations])
    return [_serialize_location_slim(loc, aggregates.get(loc.id), request) for loc in locations]


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
        # Match idx_locations_search_trgm exactly: coalesce(...) || ' ' || coalesce(...) || ' ' || coalesce(...)
        # Same expression form lets Postgres pick the trigram GIN index for substring search.
        searchable = (
            func.coalesce(models.Location.name, '')
            .op('||')(' ')
            .op('||')(func.coalesce(models.Location.short_desc, ''))
            .op('||')(' ')
            .op('||')(func.coalesce(models.Location.full_description, ''))
        )
        query = query.filter(searchable.ilike(like_term))
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


def _normalize_view_type_or_fail(view_type: str) -> str:
    normalized = (view_type or "").strip().lower()
    if normalized not in {"mission_detail", "gallery"}:
        raise HTTPException(status_code=400, detail="view_type must be mission_detail or gallery")
    return normalized


def _normalize_viewer_key(viewer_key: Optional[str]) -> Optional[str]:
    normalized = (viewer_key or "").strip()
    return normalized[:120] or None


def _serialize_location_with_weekly_views(loc: models.Location, weekly_views: int, aggregate: Optional[Dict[str, float | int]] = None, request: Optional[Request] = None):
    data = _serialize_location_slim(loc, aggregate, request)
    data["weekly_views"] = int(weekly_views)
    return data


def _build_popular_this_week_response(db: Session, request: Request, limit: int = 6):
    normalized_limit = max(1, min(limit, 12))
    since = datetime.now(timezone.utc) - timedelta(days=7)
    rows = (
        db.query(
            models.LocationView.location_id,
            func.count(models.LocationView.id).label("weekly_views"),
        )
        .join(models.Location, models.Location.id == models.LocationView.location_id)
        .filter(models.Location.is_archived == 0, models.LocationView.viewed_at >= since)
        .group_by(models.LocationView.location_id)
        .order_by(func.count(models.LocationView.id).desc(), models.LocationView.location_id.asc())
        .limit(normalized_limit)
        .all()
    )
    if not rows:
        return {"items": []}

    locations = db.query(models.Location).filter(models.Location.id.in_([row.location_id for row in rows])).all()
    location_map = {loc.id: loc for loc in locations}
    aggregates = _get_reviews_aggregate_for_ids(db, list(location_map.keys()))
    return {
        "items": [
            _serialize_location_with_weekly_views(location_map[row.location_id], int(row.weekly_views or 0), aggregates.get(row.location_id), request)
            for row in rows
            if row.location_id in location_map
        ]
    }


def _build_traffic_series_response(db: Session, range_days: int):
    normalized_range = range_days if range_days in {7, 30, 90} else 7
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=normalized_range - 1)
    rows = (
        db.query(
            func.date(models.LocationView.viewed_at).label("day"),
            func.count(models.LocationView.id).label("views"),
        )
        .join(models.Location, models.Location.id == models.LocationView.location_id)
        .filter(models.Location.is_archived == 0, models.LocationView.viewed_at >= start_date)
        .group_by(func.date(models.LocationView.viewed_at))
        .order_by(func.date(models.LocationView.viewed_at).asc())
        .all()
    )
    view_map = {str(row.day): int(row.views or 0) for row in rows}
    points = []
    total_views = 0
    for offset in range(normalized_range):
        current_day = start_date + timedelta(days=offset)
        key = current_day.isoformat()
        views = view_map.get(key, 0)
        total_views += views
        points.append({
            "label": current_day.strftime("%d %b"),
            "views": views,
        })
    return {
        "range_days": normalized_range,
        "total_views": total_views,
        "points": points,
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


@app.get("/api/locations", tags=["Locations"])
def get_locations(
    request: Request,
    response: Response,
    skip: int = 0,
    limit: int = 100,
    highlight_type: Optional[str] = None,
    chapter: Optional[str] = None,
    search: Optional[str] = None,
    include_archived: Optional[str] = None,
    fields: Optional[str] = None,
    db: Session = Depends(get_db),
):
    include_archived_flag = _parse_include_archived_flag(include_archived)
    query = _filter_archived(db.query(models.Location), include_archived_flag)
    query = _apply_location_filters(query, highlight_type, chapter, search)
    locations = query.order_by(models.Location.visited_date.desc()).offset(skip).limit(limit).all()
    if fields == "full":
        # Admin-only path; never cache to ensure post-edit reloads are fresh.
        _set_no_store(response)
        return _serialize_locations_with_aggregates(db, locations, request)
    _set_public_cache(response)
    return _serialize_locations_slim(db, locations, request)


@app.get("/api/locations/paginated", response_model=schemas.PaginatedLocations, tags=["Locations"])
def get_locations_paginated(
    request: Request,
    response: Response,
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

    _set_public_cache(response)
    return {
        "items": _serialize_locations_slim(db, items, request),
        "total": total,
        "has_more": skip + limit < total
    }


@app.get("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
async def get_location_by_id(request: Request, response: Response, location_id: str, include_archived: Optional[str] = None, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id, include_archived=_parse_include_archived_flag(include_archived))
    data = _serialize_location_with_aggregate(db, location, request)
    _set_public_cache(response)
    return await _attach_weather(data, location)


@app.post("/api/locations/{location_id}/views", tags=["Stats"])
def create_location_view(location_id: str, payload: schemas.LocationViewCreate, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id)
    view_type = _normalize_view_type_or_fail(payload.view_type)
    viewer_key = _normalize_viewer_key(payload.viewer_key)

    if viewer_key:
        recent_since = datetime.now(timezone.utc) - timedelta(minutes=30)
        existing = (
            db.query(models.LocationView.id)
            .filter(
                models.LocationView.location_id == location_id,
                models.LocationView.view_type == view_type,
                models.LocationView.viewer_key == viewer_key,
                models.LocationView.viewed_at >= recent_since,
            )
            .first()
        )
        if existing is not None:
            return {"ok": True, "deduped": True}

    db.add(models.LocationView(location_id=location_id, view_type=view_type, viewer_key=viewer_key))
    db.commit()
    return {"ok": True, "deduped": False}


@app.post("/api/locations", response_model=schemas.LocationOut, status_code=201, tags=["Locations"])
async def create_location(request: Request, location: schemas.LocationCreate, db: Session = Depends(get_db)):
    if db.query(models.Location).filter(models.Location.id == location.id).first():
        raise HTTPException(status_code=400, detail="Location ID already exists")
    _ensure_unique_chapter(db, location.chapter)

    payload = _normalize_location_payload(location.model_dump(), for_patch=False)
    new_location = models.Location(**payload)
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    data = _serialize_location_with_aggregate(db, new_location, request)
    return await _attach_weather(data, new_location)


@app.put("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
async def update_location(request: Request, location_id: str, payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    _ensure_unique_chapter(db, payload.chapter, exclude_location_id=location_id)

    payload_data = _normalize_location_payload(payload.model_dump(), for_patch=False)
    for field, value in payload_data.items():
        setattr(loc, field, value)

    db.commit()
    db.refresh(loc)
    data = _serialize_location_with_aggregate(db, loc, request)
    return await _attach_weather(data, loc)


@app.patch("/api/locations/{location_id}", response_model=schemas.LocationOut, tags=["Locations"])
async def patch_location(request: Request, location_id: str, payload: schemas.LocationPatch, db: Session = Depends(get_db)):
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
    data = _serialize_location_with_aggregate(db, loc, request)
    return await _attach_weather(data, loc)


@app.delete("/api/locations/{location_id}", status_code=204, tags=["Locations"])
def archive_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    loc.is_archived = 1
    loc.archived_at = datetime.now(timezone.utc)
    db.commit()


@app.post("/api/locations/{location_id}/restore", response_model=schemas.RestoreLocationResponse, tags=["Locations"])
async def restore_location(request: Request, location_id: str, db: Session = Depends(get_db)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if loc is None:
        raise HTTPException(status_code=404, detail="Location not found")
    loc.is_archived = 0
    loc.archived_at = None
    db.commit()
    db.refresh(loc)
    data = _serialize_location_with_aggregate(db, loc, request)
    data = await _attach_weather(data, loc)
    return schemas.RestoreLocationResponse(location=data)


@app.get("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def get_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
    return _build_location_reviews_response(db, location_id)


@app.post("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, status_code=201, tags=["Reviews"])
def create_location_review(request: Request, location_id: str, payload: schemas.ReviewCreate, db: Session = Depends(get_db)):
    _enforce_rate_limit(request, "reviews:create", location_id)
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
    _invalidate_review_aggregates()

    return _build_location_reviews_response(db, location_id)


@app.delete("/api/locations/{location_id}/reviews/{review_id}", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def delete_location_review(location_id: str, review_id: int, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
    review = db.query(models.Review).filter(models.Review.id == review_id, models.Review.location_id == location_id).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    _invalidate_review_aggregates()
    return _build_location_reviews_response(db, location_id)


@app.delete("/api/locations/{location_id}/reviews", response_model=schemas.LocationReviewsOut, tags=["Reviews"])
def delete_all_location_reviews(location_id: str, db: Session = Depends(get_db)):
    _ensure_location_exists(db, location_id, include_archived=True)
    db.query(models.Review).filter(models.Review.location_id == location_id).delete(synchronize_session=False)
    db.commit()
    _invalidate_review_aggregates()
    return _build_location_reviews_response(db, location_id)


@app.get("/api/locations/{location_id}/image-notes", response_model=schemas.ImageNotesOut, tags=["ImageNotes"])
def get_image_notes(location_id: str, image_src: str, db: Session = Depends(get_db)):
    location = _ensure_location_exists(db, location_id, include_archived=True)
    normalized_src = _normalize_image_src_or_fail(image_src)
    if normalized_src not in _extract_location_gallery_image_set(location):
        raise HTTPException(status_code=404, detail="Image not found for this location")
    return _build_image_notes_response(db, location_id, normalized_src)


@app.post("/api/locations/{location_id}/image-notes", response_model=schemas.ImageNotesOut, status_code=201, tags=["ImageNotes"])
def create_image_note(request: Request, location_id: str, payload: schemas.ImageNoteCreate, db: Session = Depends(get_db)):
    _enforce_rate_limit(request, "image_notes:create", location_id)
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
def get_stats(response: Response, db: Session = Depends(get_db)):
    type_rows = (
        db.query(models.Location.highlight_type, func.count(models.Location.id))
        .filter(models.Location.is_archived == 0)
        .group_by(models.Location.highlight_type)
        .all()
    )
    type_counts = {row[0]: int(row[1] or 0) for row in type_rows}
    total_locations = sum(type_counts.values())
    total_chapters = (
        db.query(func.count(func.distinct(models.Location.chapter)))
        .filter(models.Location.is_archived == 0)
        .scalar()
    ) or 0

    _set_public_cache(response)
    return schemas.StatsOut(
        total_locations=total_locations,
        total_chapters=int(total_chapters),
        locations_by_type={ht: type_counts.get(ht, 0) for ht in ("primary", "secondary", "highlight")},
    )


@app.get("/api/stats/popular-this-week", response_model=schemas.PopularWeeklyOut, tags=["Stats"])
def get_popular_this_week(request: Request, response: Response, limit: int = 6, db: Session = Depends(get_db)):
    _set_public_cache(response)
    return _build_popular_this_week_response(db, request, limit)


@app.get("/api/stats/traffic-series", response_model=schemas.TrafficSeriesOut, tags=["Stats"])
def get_traffic_series(response: Response, range_days: int = 7, db: Session = Depends(get_db)):
    _set_public_cache(response)
    return _build_traffic_series_response(db, range_days)


@app.post("/api/chatbot/recommend", response_model=ChatbotResponse, tags=["Chatbot"])
def chatbot_recommend(preferences: ChatbotPreferences, db: Session = Depends(get_db)):
    return generate_recommendations(preferences, db)


@app.post("/api/chatbot/message", response_model=ChatbotMessageResponse, tags=["Chatbot"])
def chatbot_message(request: Request, payload: ChatbotMessageRequest, db: Session = Depends(get_db)):
    client_key = payload.viewer_key or _client_ip(request)
    try:
        return generate_chat_response(payload, db, client_key)
    except ValueError as exc:
        detail = str(exc)
        if detail.startswith("Too many chat messages"):
            raise HTTPException(status_code=429, detail=detail)
        raise HTTPException(status_code=400, detail=detail)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Could not generate chatbot reply")
