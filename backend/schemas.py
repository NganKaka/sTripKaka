from pydantic import BaseModel
from typing import Dict, List, Optional


class LocationBase(BaseModel):
    id: str
    name: str
    chapter: str
    short_desc: str
    img: str
    visited_date: str
    highlight_type: str
    lat: str
    lng: str
    hero_video: Optional[str] = None
    hero_poster: Optional[str] = None
    full_description: Optional[str] = None
    gallery_images: Optional[List[str]] = None


class LocationCreate(LocationBase):
    pass


class LocationPatch(BaseModel):
    """All fields optional for PATCH requests."""
    name: Optional[str] = None
    chapter: Optional[str] = None
    short_desc: Optional[str] = None
    img: Optional[str] = None
    visited_date: Optional[str] = None
    highlight_type: Optional[str] = None
    lat: Optional[str] = None
    lng: Optional[str] = None
    hero_video: Optional[str] = None
    hero_poster: Optional[str] = None
    full_description: Optional[str] = None
    gallery_images: Optional[List[str]] = None


class LocationOut(LocationBase):
    class Config:
        from_attributes = True


class PaginatedLocations(BaseModel):
    items: List[LocationOut]
    total: int
    has_more: bool


class StatsOut(BaseModel):
    total_locations: int
    total_chapters: int
    locations_by_type: Dict[str, int]
