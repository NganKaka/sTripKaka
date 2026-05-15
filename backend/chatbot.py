"""
Chatbot Trip Recommender — retrieval-first recommendations over real trip data.
"""

import asyncio
import json
import logging
import os
import re
import textwrap
import time
import unicodedata
from collections import defaultdict, deque
from typing import List, Literal, Optional

import httpx
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from services.weather import fetch_weather_sync

logger = logging.getLogger("chatbot")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
CHAT_RATE_LIMIT_WINDOW_SECONDS = 60
CHAT_RATE_LIMIT_MAX_REQUESTS = 10
_CHAT_RATE_LIMIT_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


class ChatbotPreferences(BaseModel):
    weather_pref: str = Field(default="any", description="sunny, cool, rainy, any")
    food_pref: str = Field(default="any", description="street_food, seafood, fine_dining, traditional, any")
    vibe: str = Field(default="any", description="adventure, cultural, relaxing, beach, nature, any")
    duration: str = Field(default="weekend", description="weekend, short_trip, one_week")


class WeatherSnapshot(BaseModel):
    condition: str = "unknown"
    temperature_c: float = 0.0
    is_day: bool = True


class RecommendedLocation(BaseModel):
    id: str
    name: str
    chapter: str
    short_desc: str
    img: str
    highlight_type: str
    lat: str
    lng: str
    average_stars: float = 5.0
    total_reviews: int = 0
    weather: Optional[WeatherSnapshot] = None
    match_score: int = 0
    match_reasons: List[str] = []


class ChatbotResponse(BaseModel):
    recommendations: List[RecommendedLocation]
    trip_plan: str
    greeting: str
    note: str = ""


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)


class ChatbotMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: List[ChatMessageIn] = Field(default_factory=list, max_length=12)
    current_location_id: Optional[str] = Field(default=None, max_length=80)
    viewer_key: Optional[str] = Field(default=None, max_length=120)
    recent_location_ids: List[str] = Field(default_factory=list, max_length=6)


class ChatbotLocationSuggestion(BaseModel):
    id: str
    name: str
    chapter: str
    short_desc: str
    img: str
    highlight_type: str
    href: str
    why_matched: List[str] = []
    action: Literal["destination", "gallery"] = "destination"


class ChatbotMessageResponse(BaseModel):
    reply: str
    suggestions: List[ChatbotLocationSuggestion] = []
    source: Literal["gemini", "rules", "fallback"] = "fallback"
    intent: Optional[str] = None
    clarifying_question: Optional[str] = None
    applied_filters: List[str] = []


class QuerySlots(BaseModel):
    intent: str = "recommend"
    vibes: List[str] = []
    foods: List[str] = []
    weather: List[str] = []
    exact_location_id: Optional[str] = None
    wants_current: bool = False
    wants_gallery: bool = False
    wants_popular: bool = False
    wants_weekend: bool = False
    terms: List[str] = []


WEATHER_KEYWORDS: dict[str, dict[str, int]] = {
    "sunny": {"beach": 10, "sunny": 8, "tropical": 9, "island": 10, "warm": 7, "sunset": 8, "ocean": 6, "sea": 6, "coastal": 7},
    "cool": {"imperial": 9, "ancient": 7, "citadel": 10, "mist": 8, "mountain": 6, "river": 5, "temple": 8, "historic": 7, "royal": 8},
    "rainy": {"monsoon": 9, "rain": 8, "mist": 6, "fog": 6, "storm": 7, "waterfall": 7, "forest": 6, "green": 5},
}

FOOD_KEYWORDS: dict[str, dict[str, int]] = {
    "street_food": {"street": 10, "market": 9, "local": 7, "food": 6, "stall": 8, "noodle": 7, "pho": 7, "vendor": 7},
    "seafood": {"seafood": 10, "fish": 9, "ocean": 8, "crab": 10, "squid": 8, "shrimp": 8, "sea": 7, "island": 6, "fresh": 5},
    "fine_dining": {"fine": 10, "dining": 9, "imperial": 8, "royal": 9, "cuisine": 7, "elegant": 6, "restaurant": 5},
    "traditional": {"traditional": 10, "ancient": 7, "royal": 6, "imperial": 6, "local": 7, "cuisine": 5, "heritage": 6, "family": 4},
}

VIBE_KEYWORDS: dict[str, dict[str, int]] = {
    "adventure": {"explore": 8, "adventure": 10, "trek": 8, "hike": 7, "mountain": 6, "trail": 7, "expedition": 8, "discover": 6},
    "cultural": {"imperial": 10, "ancient": 9, "citadel": 10, "temple": 9, "pagoda": 9, "royal": 8, "dynasty": 8, "culture": 7, "heritage": 8, "historic": 8, "history": 8},
    "relaxing": {"relax": 10, "sunset": 9, "beach": 8, "escape": 7, "peaceful": 8, "calm": 7, "serene": 8, "chill": 8},
    "beach": {"beach": 10, "island": 10, "sea": 9, "ocean": 9, "sand": 8, "sunset": 7, "coastal": 8, "shore": 8, "tropical": 7},
    "nature": {"nature": 10, "forest": 8, "mountain": 8, "landscape": 7, "waterfall": 8, "river": 7, "green": 6, "hill": 6},
    "photo": {"photo": 10, "photos": 10, "gallery": 8, "sunset": 8, "landscape": 7, "view": 6, "scenic": 8, "camera": 7},
    "family": {"family": 10, "easy": 6, "calm": 6, "safe": 5, "local": 4},
}

INTENT_WORDS = {
    "culture": {"culture", "history", "historic", "imperial", "temple", "heritage", "ancient"},
    "food": {"food", "eat", "cuisine", "seafood", "restaurant", "market"},
    "photo": {"photo", "photos", "photography", "view", "gallery", "scenic", "camera"},
    "weather": {"weather", "sunny", "rainy", "hot", "cool", "temperature"},
    "gallery": {"gallery", "images", "pictures", "photos"},
    "popular": {"popular", "trending", "top", "best"},
}

STOPWORDS = {"a", "an", "the", "i", "want", "need", "me", "to", "for", "with", "and", "or", "trip", "place", "places", "somewhere", "recommend", "show", "tell", "about", "this", "that"}


def _normalize_message(value: str) -> str:
    return " ".join((value or "").strip().split())


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9\s_-]", " ", normalized.lower()).replace("đ", "d")


def _tokens(value: str) -> list[str]:
    return [token for token in _normalize_text(value).split() if len(token) > 1 and token not in STOPWORDS]


def enforce_chat_rate_limit(client_key: str):
    now = time.time()
    window_start = now - CHAT_RATE_LIMIT_WINDOW_SECONDS
    bucket = _CHAT_RATE_LIMIT_BUCKETS[client_key]
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= CHAT_RATE_LIMIT_MAX_REQUESTS:
        raise ValueError("Too many chat messages. Please wait a moment and try again.")
    bucket.append(now)
    if len(_CHAT_RATE_LIMIT_BUCKETS) > 1024:
        for stale_key in [key for key, b in _CHAT_RATE_LIMIT_BUCKETS.items() if not b or b[-1] < window_start]:
            _CHAT_RATE_LIMIT_BUCKETS.pop(stale_key, None)


def _location_text(loc: models.Location) -> str:
    node_bits: list[str] = []
    for node in (loc.gallery_nodes or []):
        if not isinstance(node, dict):
            continue
        node_bits.append(str(node.get("title") or ""))
        node_bits.append(str(node.get("description") or ""))
        for tags in node.get("image_tags") or []:
            if isinstance(tags, list):
                node_bits.extend(str(tag) for tag in tags)
    return _normalize_text(" ".join([loc.name, loc.short_desc, loc.full_description or "", loc.chapter, loc.highlight_type or "", *node_bits]))


def _get_review_aggregates(db: Session, location_ids: list[str]) -> dict[str, dict[str, float | int]]:
    if not location_ids:
        return {}
    rows = (
        db.query(models.Review.location_id, models.func.avg(models.Review.stars).label("average_stars"), models.func.count(models.Review.id).label("total_reviews"))
        .filter(models.Review.location_id.in_(location_ids))
        .group_by(models.Review.location_id)
        .all()
    )
    return {row.location_id: {"average_stars": float(row.average_stars or 5.0), "total_reviews": int(row.total_reviews or 0)} for row in rows}


def _get_weekly_views(db: Session, location_ids: list[str]) -> dict[str, int]:
    if not location_ids:
        return {}
    cutoff = time.time() - (7 * 24 * 60 * 60)
    rows = (
        db.query(models.LocationView.location_id, models.func.count(models.LocationView.id).label("views"))
        .filter(models.LocationView.location_id.in_(location_ids))
        .filter(models.LocationView.viewed_at >= cutoff)
        .group_by(models.LocationView.location_id)
        .all()
    )
    return {row.location_id: int(row.views or 0) for row in rows}


def _parse_query(message: str, locations: List[models.Location], current_location_id: Optional[str]) -> QuerySlots:
    query = _normalize_text(message)
    token_set = set(_tokens(message))
    slots = QuerySlots(terms=list(token_set))

    if current_location_id and any(phrase in query for phrase in ["this place", "this trip", "here", "current"]):
        slots.wants_current = True
        slots.exact_location_id = current_location_id
        slots.intent = "current-location"

    for loc in locations:
        name = _normalize_text(loc.name)
        if loc.id and loc.id.lower() in query or (name and name in query):
            slots.exact_location_id = loc.id
            slots.intent = "current-location"
            break

    if token_set & INTENT_WORDS["gallery"]:
        slots.wants_gallery = True
        slots.intent = "gallery"
    if token_set & INTENT_WORDS["photo"]:
        slots.vibes.append("photo")
        slots.intent = "photo"
    if token_set & INTENT_WORDS["culture"]:
        slots.vibes.append("cultural")
        slots.intent = "culture"
    if token_set & INTENT_WORDS["food"]:
        slots.foods.append("seafood" if "seafood" in token_set else "street_food")
        slots.intent = "food"
    if token_set & INTENT_WORDS["weather"]:
        slots.intent = "weather"
        if {"rain", "rainy", "mist", "fog"} & token_set:
            slots.weather.append("rainy")
        elif {"cool", "cold"} & token_set:
            slots.weather.append("cool")
        else:
            slots.weather.append("sunny")
    if token_set & INTENT_WORDS["popular"]:
        slots.wants_popular = True
        slots.intent = "popular"
    if {"beach", "island", "sea", "ocean", "sunset"} & token_set:
        slots.vibes.append("beach")
        if slots.intent == "recommend":
            slots.intent = "beach"
    if {"nature", "forest", "mountain", "waterfall", "river"} & token_set:
        slots.vibes.append("nature")
    if {"relax", "relaxing", "chill", "calm", "peaceful"} & token_set:
        slots.vibes.append("relaxing")
    if {"adventure", "explore", "trek", "hike"} & token_set:
        slots.vibes.append("adventure")
    if {"family", "kids"} & token_set:
        slots.vibes.append("family")
    if {"weekend", "short"} & token_set:
        slots.wants_weekend = True

    slots.vibes = list(dict.fromkeys(slots.vibes))
    slots.foods = list(dict.fromkeys(slots.foods))
    slots.weather = list(dict.fromkeys(slots.weather))
    return slots


def _is_ambiguous(message: str, slots: QuerySlots) -> bool:
    if slots.exact_location_id or slots.vibes or slots.foods or slots.weather or slots.wants_popular:
        return False
    meaningful = [term for term in slots.terms if term not in {"travel", "go", "where", "what", "should", "start"}]
    return len(meaningful) < 2


def _clarifying_question() -> str:
    return "What kind of trip do you want: beach sunset, culture/history, food, nature, or photo spots?"


def _reason_label(reason: str) -> str:
    labels = {
        "exact-location": "exact place match",
        "current-location": "based on this page",
        "recent-view": "similar to your recent views",
        "gallery-rich": "strong photo gallery",
        "popular": "popular this week",
        "high-rating": "high visitor rating",
        "weekend": "fits a short trip",
    }
    if reason.startswith("vibe:"):
        return f"matches {reason.split(':', 1)[1]} vibe"
    if reason.startswith("food:"):
        return f"matches {reason.split(':', 1)[1].replace('_', ' ')} interest"
    if reason.startswith("weather:"):
        return f"matches {reason.split(':', 1)[1]} mood"
    if reason.startswith("text:"):
        return f"matched keyword: {reason.split(':', 1)[1]}"
    return reason.replace("-", " ")


def _to_recommended_location(loc: models.Location, score: int = 0, reasons: Optional[List[str]] = None, include_weather: bool = True, aggregate: Optional[dict[str, float | int]] = None) -> RecommendedLocation:
    weather_snap: Optional[WeatherSnapshot] = None
    if include_weather:
        try:
            wr = fetch_weather_sync(loc.lat, loc.lng)
            if wr:
                weather_snap = WeatherSnapshot(condition=wr.condition, temperature_c=wr.temperature_c, is_day=wr.is_day)
        except Exception:
            pass

    aggregate = aggregate or {}
    return RecommendedLocation(
        id=loc.id,
        name=loc.name,
        chapter=loc.chapter,
        short_desc=loc.short_desc,
        img=loc.img,
        highlight_type=loc.highlight_type or "secondary",
        lat=loc.lat,
        lng=loc.lng,
        average_stars=float(aggregate.get("average_stars", 5.0)),
        total_reviews=int(aggregate.get("total_reviews", 0)),
        weather=weather_snap,
        match_score=score,
        match_reasons=[_reason_label(reason) for reason in (reasons or [])[:4]],
    )


def _score_candidate(loc: models.Location, slots: QuerySlots, query_terms: list[str], recent_location_ids: list[str], aggregates: dict[str, dict[str, float | int]], weekly_views: dict[str, int]) -> tuple[int, list[str]]:
    text = _location_text(loc)
    score = 0
    reasons: list[str] = []

    if slots.exact_location_id == loc.id:
        score += 100
        reasons.append("exact-location")
    if slots.wants_current and slots.exact_location_id == loc.id:
        score += 35
        reasons.append("current-location")
    if loc.id in recent_location_ids:
        score += 8
        reasons.append("recent-view")

    loc_name = _normalize_text(loc.name)
    for term in query_terms:
        if term in loc_name:
            score += 22
            reasons.append(f"text:{term}")
        elif term in text:
            score += 7
            reasons.append(f"text:{term}")

    for vibe in slots.vibes:
        matches = sum(weight for kw, weight in VIBE_KEYWORDS.get(vibe, {}).items() if kw in text)
        if matches:
            score += matches
            reasons.append(f"vibe:{vibe}")

    for food in slots.foods:
        matches = sum(weight for kw, weight in FOOD_KEYWORDS.get(food, {}).items() if kw in text)
        if matches:
            score += matches
            reasons.append(f"food:{food}")

    for weather in slots.weather:
        matches = sum(weight for kw, weight in WEATHER_KEYWORDS.get(weather, {}).items() if kw in text)
        if matches:
            score += matches
            reasons.append(f"weather:{weather}")

    if slots.wants_gallery:
        image_count = len([image for image in (loc.gallery_images or []) if image])
        node_count = len(loc.gallery_nodes or [])
        if image_count or node_count:
            score += min(18, image_count + node_count * 3)
            reasons.append("gallery-rich")

    aggregate = aggregates.get(loc.id, {})
    if float(aggregate.get("average_stars", 5.0)) >= 4.5 and int(aggregate.get("total_reviews", 0)) > 0:
        score += 10
        reasons.append("high-rating")

    if slots.wants_popular:
        views = weekly_views.get(loc.id, 0)
        if views:
            score += min(20, views * 3)
            reasons.append("popular")

    if slots.wants_weekend and loc.highlight_type in {"primary", "highlight"}:
        score += 5
        reasons.append("weekend")

    return score, list(dict.fromkeys(reasons))


def _get_active_locations(db: Session) -> List[models.Location]:
    return db.query(models.Location).filter(models.Location.is_archived == 0).all()


def _rank_locations(message: str, locations: List[models.Location], db: Session, current_location_id: Optional[str], recent_location_ids: list[str], limit: int = 3) -> tuple[List[RecommendedLocation], QuerySlots, bool]:
    slots = _parse_query(message, locations, current_location_id)
    ambiguous = _is_ambiguous(message, slots)
    location_ids = [loc.id for loc in locations]
    aggregates = _get_review_aggregates(db, location_ids)
    weekly_views = _get_weekly_views(db, location_ids) if slots.wants_popular else {}
    query_terms = slots.terms

    ranked: list[tuple[int, models.Location, list[str]]] = []
    for loc in locations:
        score, reasons = _score_candidate(loc, slots, query_terms, recent_location_ids, aggregates, weekly_views)
        if score > 0:
            ranked.append((score, loc, reasons))

    ranked.sort(key=lambda item: (item[0], item[1].visited_date or "", item[1].name), reverse=True)
    if not ranked and not ambiguous:
        ranked = [(0, loc, ["closest available match"]) for loc in locations[:limit]]

    recommendations = [
        _to_recommended_location(loc, score, reasons, include_weather=slots.intent == "weather", aggregate=aggregates.get(loc.id))
        for score, loc, reasons in ranked[:limit]
    ]
    return recommendations, slots, ambiguous


def _build_recommendations(db: Session, prefs: ChatbotPreferences, limit: int = 3) -> List[RecommendedLocation]:
    locations = _get_active_locations(db)
    query = " ".join([prefs.weather_pref, prefs.food_pref, prefs.vibe, prefs.duration]).replace("any", "")
    recommendations, _, _ = _rank_locations(query or "popular", locations, db, None, [], limit)
    return recommendations


def _build_trip_plan_rule_based(recommendations: List[RecommendedLocation], prefs: ChatbotPreferences) -> str:
    if not recommendations:
        return "## No trip matches found\n\nTry broader preferences like beach, culture, food, nature, or photo spots."

    duration_days = {"weekend": 2, "short_trip": 4, "one_week": 7}
    days = duration_days.get(prefs.duration, 3)
    plan = "## Your Personal Trip Plan\n\n"
    plan += f"Start with **{recommendations[0].name}** — {recommendations[0].short_desc}.\n\n"
    for i, loc in enumerate(recommendations[:days], start=1):
        plan += f"### Day {i}: {loc.name} — {loc.chapter}\n"
        plan += f"*{loc.short_desc}*\n"
        if loc.weather:
            plan += f"> Weather right now: **{loc.weather.condition}**, **{loc.weather.temperature_c:.0f}°C**\n"
        plan += "\n"
    plan += "### Pro Tips\n- Save the gallery before you go so you know the best photo angles.\n- Keep one flexible slot for slow wandering and local food.\n"
    return plan


async def _build_trip_plan_gemini(recommendations: List[RecommendedLocation], prefs: ChatbotPreferences) -> Optional[str]:
    if not GEMINI_API_KEY:
        return None

    loc_summaries = "\n".join(f"- {r.name} ({r.chapter}) — {r.short_desc}. Reasons: {', '.join(r.match_reasons) or 'match'}" for r in recommendations)
    dur_label = {"weekend": "a weekend (2 days)", "short_trip": "a 3-5 day trip", "one_week": "a full week (7 days)"}.get(prefs.duration, "a few days")
    prompt = textwrap.dedent(f"""\
        You are a travel assistant for Vietnamese destinations.
        Write a concise markdown trip plan using only these recommended destinations.
        Preferences: weather={prefs.weather_pref}, food={prefs.food_pref}, vibe={prefs.vibe}, duration={dur_label}.

        Recommended destinations:
        {loc_summaries}

        Keep it under 500 words. Do not invent places or facts outside the list.
    """)

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                params={"key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
        if resp.status_code != 200:
            logger.warning("Gemini returned %d: %s", resp.status_code, resp.text[:300])
            return None
        body = resp.json()
        candidates = body.get("candidates", [])
        if not candidates:
            return None
        text = "".join(part.get("text", "") for part in candidates[0].get("content", {}).get("parts", []))
        return text.strip() if text.strip() else None
    except Exception as exc:
        logger.warning("Gemini call failed: %s", exc)
        return None


def build_greeting(prefs: ChatbotPreferences) -> str:
    dur = {"weekend": "a weekend escape", "short_trip": "a 3-5 day adventure", "one_week": "a week-long journey"}.get(prefs.duration, "a trip")
    label = {"adventure": "thrill-seeker", "cultural": "culture lover", "relaxing": "peace seeker", "beach": "beach lover", "nature": "nature explorer"}.get(prefs.vibe, "traveler")
    return f"Hey {label}! Here's your perfect {dur}."


def generate_recommendations(preferences: ChatbotPreferences, db: Session) -> ChatbotResponse:
    recommendations = _build_recommendations(db, preferences, limit=3)
    if GEMINI_API_KEY:
        try:
            trip_plan = asyncio.run(_build_trip_plan_gemini(recommendations, preferences)) or _build_trip_plan_rule_based(recommendations, preferences)
        except Exception:
            trip_plan = _build_trip_plan_rule_based(recommendations, preferences)
    else:
        trip_plan = _build_trip_plan_rule_based(recommendations, preferences)
    return ChatbotResponse(recommendations=recommendations, trip_plan=trip_plan, greeting=build_greeting(preferences), note="")


def _to_chat_suggestion(loc: RecommendedLocation, action: Literal["destination", "gallery"] = "destination") -> ChatbotLocationSuggestion:
    return ChatbotLocationSuggestion(
        id=loc.id,
        name=loc.name,
        chapter=loc.chapter,
        short_desc=loc.short_desc,
        img=loc.img,
        highlight_type=loc.highlight_type or "secondary",
        href=f"/{'gallery' if action == 'gallery' else 'mission-detail'}/{loc.id}",
        why_matched=loc.match_reasons,
        action=action,
    )


def _rule_based_chat_reply(message: str, recommendations: List[RecommendedLocation], slots: QuerySlots, ambiguous: bool) -> tuple[str, str, Optional[str]]:
    if ambiguous:
        return ("I can help narrow the journal, but I need one more clue first.", slots.intent, _clarifying_question())
    if not recommendations:
        return ("I couldn't find a strong match yet. Try beach, culture, food, nature, or photo spots.", slots.intent, _clarifying_question())

    lead = recommendations[0]
    reason = lead.match_reasons[0] if lead.match_reasons else "best overall match"
    if slots.intent == "current-location":
        return (f"You're looking at **{lead.name}** — {lead.short_desc}. I matched it because it is {reason}.", slots.intent, None)
    if slots.intent == "food":
        return (f"For a food-focused trip, start with **{lead.name}**. It is {reason}, and the other cards give nearby alternatives from the journal.", slots.intent, None)
    if slots.intent in {"culture", "beach", "photo", "gallery", "weather", "popular"}:
        return (f"I'd start with **{lead.name}**. It is {reason}; I also ranked the other options from real trip data below.", slots.intent, None)
    return (f"Based on your request, **{lead.name}** is the strongest match because it is {reason}. Tap a card to open the full story.", slots.intent, None)


async def _build_chat_reply_gemini(message: str, history: List[ChatMessageIn], recommendations: List[RecommendedLocation], slots: QuerySlots, current_location_id: Optional[str] = None) -> Optional[dict]:
    if not GEMINI_API_KEY or not recommendations:
        return None

    location_context = "\n".join(
        f"- {loc.id}: {loc.name} ({loc.chapter}) — {loc.short_desc}. Reasons: {', '.join(loc.match_reasons) or 'match'}. Rating: {loc.average_stars:.1f} from {loc.total_reviews} reviews."
        for loc in recommendations
    )
    history_context = "\n".join(f"{item.role}: {item.content}" for item in history[-8:]) or "No prior history."
    prompt = textwrap.dedent(f"""\
        You are the sTripKaka trip assistant.
        Answer only using the supplied destinations and reasons.
        Do not invent places, prices, booking details, external links, or facts not in context.
        Return strict JSON with keys: reply, suggestion_ids, intent.

        Current location id: {current_location_id or 'none'}
        Detected intent: {slots.intent}
        Conversation history:
        {history_context}

        User message:
        {message}

        Ranked candidate destinations:
        {location_context}
    """)

    try:
        async with httpx.AsyncClient(timeout=6) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                params={"key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
        if resp.status_code != 200:
            logger.warning("Gemini chat returned %d: %s", resp.status_code, resp.text[:300])
            return None
        body = resp.json()
        candidates = body.get("candidates", [])
        if not candidates:
            return None
        text = "".join(part.get("text", "") for part in candidates[0].get("content", {}).get("parts", []))
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return None
        return json.loads(text[start:end + 1])
    except Exception as exc:
        logger.warning("Gemini chat failed: %s", exc)
        return None


def generate_chat_response(payload: ChatbotMessageRequest, db: Session, client_key: str) -> ChatbotMessageResponse:
    started = time.time()
    message = _normalize_message(payload.message)
    if not message:
        raise ValueError("Message cannot be empty.")

    enforce_chat_rate_limit(client_key)
    locations = _get_active_locations(db)
    recommendations, slots, ambiguous = _rank_locations(message, locations, db, payload.current_location_id, payload.recent_location_ids)
    reply, intent, clarifying_question = _rule_based_chat_reply(message, recommendations, slots, ambiguous)
    action: Literal["destination", "gallery"] = "gallery" if slots.wants_gallery or slots.intent in {"photo", "gallery"} else "destination"
    suggestions = [_to_chat_suggestion(rec, action) for rec in recommendations[:3]]
    source: Literal["gemini", "rules", "fallback"] = "rules"

    if GEMINI_API_KEY and not clarifying_question:
        try:
            gemini = asyncio.run(_build_chat_reply_gemini(message, payload.history, recommendations, slots, payload.current_location_id))
            if gemini:
                suggestion_ids = gemini.get("suggestion_ids") or []
                suggestion_map = {suggestion.id: suggestion for suggestion in suggestions}
                ordered = [suggestion_map[sid] for sid in suggestion_ids if sid in suggestion_map]
                suggestions = (ordered or suggestions)[:3]
                reply = _normalize_message(gemini.get("reply", "")) or reply
                intent = gemini.get("intent") or intent
                source = "gemini"
        except Exception:
            source = "fallback"

    logger.info(
        "chatbot_query intent=%s suggestions=%s clarification=%s source=%s latency_ms=%d",
        intent,
        [suggestion.id for suggestion in suggestions],
        bool(clarifying_question),
        source,
        int((time.time() - started) * 1000),
    )
    return ChatbotMessageResponse(
        reply=reply,
        suggestions=suggestions,
        source=source,
        intent=intent,
        clarifying_question=clarifying_question,
        applied_filters=[*slots.vibes, *slots.foods, *slots.weather],
    )
