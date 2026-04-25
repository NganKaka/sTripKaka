from sqlalchemy import Column, String, Text, ARRAY, JSON, Integer, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, index=True)  # e.g. "phu_quoc", "hue"
    name = Column(String, index=True)
    chapter = Column(String)
    short_desc = Column(Text)           # Used in dashboard cards
    img = Column(String)                # Thumbnail in dashboard/map
    visited_date = Column(String)
    highlight_type = Column(String)     # "primary", "secondary", "highlight"
    lat = Column(String)
    lng = Column(String)

    # Detailed content for Trip Detail / Gallery views
    hero_video = Column(String, nullable=True)
    hero_poster = Column(String, nullable=True)
    featured_images = Column(ARRAY(String), nullable=True)
    full_description = Column(Text, nullable=True)
    gallery_images = Column(ARRAY(String), nullable=True)  # List of image URLs
    gallery_nodes = Column(JSON, nullable=True)            # Structured gallery nodes
    is_archived = Column(Integer, nullable=False, default=0, index=True)
    archived_at = Column(DateTime(timezone=True), nullable=True)

    reviews = relationship("Review", back_populates="location", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    stars = Column(Integer, nullable=False)
    nickname = Column(String(80), nullable=False, default="Guest")
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    location = relationship("Location", back_populates="reviews")
    notifications = relationship("Notification", back_populates="review", cascade="all, delete-orphan")

    __mapper_args__ = {"eager_defaults": True}

    def __init__(self, **kwargs):
        stars = kwargs.get("stars")
        if stars is not None and (stars < 0 or stars > 5):
            raise ValueError("stars must be between 0 and 5")
        super().__init__(**kwargs)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(BigInteger, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, nullable=False, default=0, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    location = relationship("Location")
    review = relationship("Review", back_populates="notifications")

    __mapper_args__ = {"eager_defaults": True}

    @property
    def read(self):
        return bool(self.is_read)

    @read.setter
    def read(self, value):
        self.is_read = 1 if value else 0
