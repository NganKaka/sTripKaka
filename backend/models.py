from sqlalchemy import Column, String, Text, ARRAY
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
    full_description = Column(Text, nullable=True)
    gallery_images = Column(ARRAY(String), nullable=True)  # List of image URLs
