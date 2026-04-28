from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class GalleryNode(BaseModel):
    title: str = ''
    description: str = ''
    images: List[str] = Field(default_factory=lambda: ['', '', ''], min_length=3, max_length=3)
    image_tags: List[List[str]] = Field(default_factory=lambda: [[], [], []])


class AmbientWeatherOut(BaseModel):
    condition: str = 'unknown'
    temperature_c: float = 0.0
    is_day: bool = True
    source: str = 'open-meteo'
    fetched_at: float = 0.0
    stale: bool = False


class AmbientOut(BaseModel):
    weather: Optional[AmbientWeatherOut] = None


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
    music_url: Optional[str] = None
    featured_images: Optional[List[str]] = Field(default_factory=lambda: ['', '', ''], min_length=3, max_length=3)
    full_description: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    gallery_nodes: Optional[List[GalleryNode]] = None
    is_archived: bool = False
    archived_at: Optional[datetime] = None


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
    music_url: Optional[str] = None
    featured_images: Optional[List[str]] = Field(default_factory=lambda: ['', '', ''], min_length=3, max_length=3)
    full_description: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    gallery_nodes: Optional[List[GalleryNode]] = None
    is_archived: Optional[bool] = None
    archived_at: Optional[datetime] = None


class LocationOut(LocationBase):
    average_stars: float = 5.0
    total_reviews: int = 0
    ambient: Optional[AmbientOut] = None

    class Config:
        from_attributes = True


class RestoreLocationResponse(BaseModel):
    location: LocationOut


class ReviewCreate(BaseModel):
    stars: int = Field(ge=0, le=5)
    nickname: Optional[str] = 'Guest'
    comment: str


class ReviewOut(BaseModel):
    id: int
    location_id: str
    stars: int
    nickname: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class LocationReviewsOut(BaseModel):
    average_stars: float = 5.0
    total_reviews: int = 0
    reviews: List[ReviewOut]


class ImageNoteCreate(BaseModel):
    image_src: str
    nickname: Optional[str] = 'Guest'
    comment: str = Field(min_length=1, max_length=150)


class ImageNoteOut(BaseModel):
    id: int
    location_id: str
    image_src: str
    nickname: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class ImageNotesOut(BaseModel):
    total_notes: int = 0
    remaining_slots: int = 3
    notes: List[ImageNoteOut]


class NotificationOut(BaseModel):
    id: int
    location_id: str
    review_id: Optional[int] = None
    image_note_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationsOut(BaseModel):
    unread_count: int = 0
    notifications: List[NotificationOut]


class PaginatedLocations(BaseModel):
    items: List[LocationOut]
    total: int
    has_more: bool


class LocationViewCreate(BaseModel):
    view_type: str = Field(min_length=1, max_length=32)
    viewer_key: Optional[str] = Field(default=None, max_length=120)


class LocationWeeklyViewOut(LocationOut):
    weekly_views: int = 0


class PopularWeeklyOut(BaseModel):
    items: List[LocationWeeklyViewOut]


class StatsOut(BaseModel):
    total_locations: int
    total_chapters: int
    locations_by_type: Dict[str, int]
