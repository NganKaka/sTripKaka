"""
Open-Meteo current-weather service with lightweight in-memory TTL caching.

- No API key required
- Strict upstream timeout
- Provider weather codes normalised to a compact app enum
- Cache: fresh 10 min, stale on error up to +30 min, invalid-coords negative cache 10 min
- All failures are non-fatal
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger("weather")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
UPSTREAM_TIMEOUT = 5.0  # seconds – aggressive so the hero never blocks
FRESH_TTL = 10 * 60  # 10 minutes
STALE_GRACE = 30 * 60  # serve stale for up to 30 extra minutes on error
INVALID_COORD_TTL = 10 * 60  # negative-cache invalid coords

# WMO weather-code → app condition mapping
# https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
_WMO_MAP: dict[int, str] = {
    0: "clear",
    1: "clouds",
    2: "clouds",
    3: "clouds",
    45: "mist",
    48: "mist",
    51: "rain",
    53: "rain",
    55: "rain",
    56: "rain",
    57: "rain",
    61: "rain",
    63: "rain",
    65: "rain",
    66: "rain",
    67: "rain",
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    80: "rain",
    81: "rain",
    82: "rain",
    85: "snow",
    86: "snow",
    95: "thunderstorm",
    96: "thunderstorm",
    99: "thunderstorm",
}


def _map_condition(wmo_code: int) -> str:
    return _WMO_MAP.get(wmo_code, "unknown")


# ---------------------------------------------------------------------------
# Output payload
# ---------------------------------------------------------------------------

@dataclass
class WeatherResult:
    condition: str
    temperature_c: float
    is_day: bool
    source: str = "open-meteo"
    fetched_at: float = field(default_factory=time.time)
    stale: bool = False


# ---------------------------------------------------------------------------
# In-memory TTL cache
# ---------------------------------------------------------------------------

@dataclass
class _CacheEntry:
    result: WeatherResult
    expires: float  # absolute time after which the entry is considered fresh-stale


_cache: dict[str, _CacheEntry] = {}
_invalid_coord_cache: dict[str, float] = {}  # key -> absolute expiry


def _cache_key(lat: float, lng: float) -> str:
    # Round to ~1 km precision to deduplicate nearby requests
    return f"{round(lat, 2)},{round(lng, 2)}"


def _get_cached(key: str, now: float) -> Optional[WeatherResult]:
    entry = _cache.get(key)
    if entry is None:
        return None
    result = entry.result
    result.stale = now > entry.expires
    return result


def _set_cache(key: str, result: WeatherResult):
    _cache[key] = _CacheEntry(result=result, expires=time.time() + FRESH_TTL)


def _set_invalid_coord(key: str):
    _invalid_coord_cache[key] = time.time() + INVALID_COORD_TTL

    # Also insert a placeholder so we never hit the API again
    placeholder = WeatherResult(
        condition="unknown",
        temperature_c=0.0,
        is_day=True,
        source="invalid-coordinate",
        stale=True,
    )
    _cache[key] = _CacheEntry(result=placeholder, expires=time.time() + INVALID_COORD_TTL)


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def parse_coordinate(value: Optional[str]) -> Optional[float]:
    """Return a float for a coordinate string, or None if unparseable."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if not (-90.0 <= f <= 90.0):
        return None
    return f


async def fetch_weather(lat_str: Optional[str], lng_str: Optional[str]) -> Optional[WeatherResult]:
    """
    Best-effort current weather for the given lat/lng strings.

    Returns None when coordinates are missing/invalid AND no stale cache
    exists.  Stale cache is returned on upstream errors.
    """
    lat = parse_coordinate(lat_str)
    lng = parse_coordinate(lng_str)
    if lat is None or lng is None:
        return None

    key = _cache_key(lat, lng)
    now = time.time()

    # 1. Negative-cache check for coordinates we already know are bad
    if key in _invalid_coord_cache and _invalid_coord_cache[key] > now:
        cached = _get_cached(key, now)
        if cached is not None:
            return cached
        return None

    # 2. Return fresh cache if available
    cached = _get_cached(key, now)
    if cached is not None and not cached.stale:
        return cached

    # 3. Fetch from provider
    try:
        async with httpx.AsyncClient(timeout=UPSTREAM_TIMEOUT) as client:
            resp = await client.get(
                OPEN_METEO_URL,
                params={
                    "latitude": lat,
                    "longitude": lng,
                    "current_weather": "true",
                },
            )
        if resp.status_code != 200:
            logger.warning("Open-Meteo returned %d for (%s,%s)", resp.status_code, lat, lng)
            _set_invalid_coord(key)
            return cached  # may be stale

        body = resp.json()
        cw = body.get("current_weather")
        if not cw:
            logger.warning("Open-Meteo missing current_weather for (%s,%s)", lat, lng)
            _set_invalid_coord(key)
            return cached

        result = WeatherResult(
            condition=_map_condition(cw.get("weathercode", -1)),
            temperature_c=float(cw.get("temperature", 0)),
            is_day=bool(cw.get("is_day", 1)),
        )
        _set_cache(key, result)
        return result

    except (httpx.TimeoutException, httpx.ConnectError, httpx.ReadError, OSError) as exc:
        logger.warning("Open-Meteo fetch failed for (%s,%s): %s", lat, lng, exc)
        # Return stale cache if within grace period
        if cached is not None and now - cached.fetched_at < STALE_GRACE:
            cached.stale = True
            return cached
        return None

    except Exception:
        logger.exception("Unexpected error fetching weather for (%s,%s)", lat, lng)
        if cached is not None and now - cached.fetched_at < STALE_GRACE:
            cached.stale = True
            return cached
        return None


def fetch_weather_sync(lat_str: Optional[str], lng_str: Optional[str]) -> Optional[WeatherResult]:
    """Synchronous wrapper for use in sync FastAPI endpoints (thread-pool)."""
    try:
        return asyncio.run(fetch_weather(lat_str, lng_str))
    except RuntimeError:
        # Fallback if an event loop is already running in this thread
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(fetch_weather(lat_str, lng_str))
        finally:
            loop.close()
