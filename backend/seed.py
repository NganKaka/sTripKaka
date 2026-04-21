"""
seed.py - Run this once to populate the database with initial data.
Usage: python seed.py
"""

from database import engine, SessionLocal
import models

# Create all tables
models.Base.metadata.create_all(bind=engine)

LOCATIONS = [
    {
        "id": "phu_quoc",
        "name": "Phu Quoc",
        "chapter": "Chapter IX",
        "short_desc": "Golden Hour Escape",
        "img": "/phu_quoc/pq_landscape_sea.jpg",
        "visited_date": "2024-03-15",
        "highlight_type": "primary",
        "lat": "10.2899",
        "lng": "103.9840",
        "hero_video": "/videos/phu_quoc.mp4",
        "hero_poster": "/phu_quoc/pq_landscape_sea.jpg",
        "full_description": (
            "We arrived on the island just as the monsoon retreated, leaving behind skies so clear it felt like "
            "stepping onto another planet. Phu Quoc is an island of contrasts — from the loud and chaotic night "
            "markets selling sea urchins, to the absolute silence of the northern beaches where the jungle meets "
            "the Gulf of Thailand.\n\n"
            "We spent our days exploring hidden beaches illuminated by slivers of sunlight, sipping coffee at "
            "Highlands overlooking the calm lake, and watching the sun dip below the jagged horizon, painting "
            "the sky in hues of deep violet and gold."
        ),
        "gallery_images": [
            "/phu_quoc/pq_landscape_sea.jpg",
            "/phu_quoc/pq_landscape_lake.jpg",
            "/phu_quoc/pq_landscape_cafe_highlands.jpg",
            "/phu_quoc/pq_landscape_sea_.jpg",
            "/phu_quoc/pq_landscape_lake_2.jpg",
            "/phu_quoc/pq_landscape_sea_2.jpg",
            "/phu_quoc/pq_landscape_sea_3.jpg",
        ],
    },
    {
        "id": "hue",
        "name": "Hue",
        "chapter": "Chapter III",
        "short_desc": "Imperial Echoes",
        "img": "/hue/hue_landscape_1.jpg",
        "visited_date": "2023-11-08",
        "highlight_type": "secondary",
        "lat": "16.4637",
        "lng": "107.5909",
        "hero_video": "",
        "hero_poster": "/hue/hue_landscape_1.jpg",
        "full_description": (
            "Walking through the ancient citadel, feeling the quiet pulse of a dynasty long past. "
            "Hue carries the weight of history in every stone, covered in lush green moss and guarded "
            "by centuries-old trees.\n\n"
            "The perfume river flows silently beneath the Truong Tien bridge. At night, the city falls "
            "asleep early, leaving the neon lights to reflect off the dark waters, as traditional folk "
            "songs echo quietly from the passing dragon boats."
        ),
        "gallery_images": [
            "/hue/hue_landscape_1.jpg",
            "/hue/hue_landscape_2.jpg",
            "/hue/hue_landscape_3.jpg",
            "/hue/hue_landscape_4.jpg",
            "/hue/hue_landscape_5.jpg",
            "/hue/hue_landscape_6.jpg",
            "/hue/hue_landscape_7.jpg",
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        for loc_data in LOCATIONS:
            exists = db.query(models.Location).filter(models.Location.id == loc_data["id"]).first()
            if not exists:
                db.add(models.Location(**loc_data))
                print(f"  [+] Inserted: {loc_data['id']}")
            else:
                # Update gallery_images in case new photos were added
                loc = db.query(models.Location).filter(models.Location.id == loc_data["id"]).first()
                loc.gallery_images = loc_data["gallery_images"]
                loc.full_description = loc_data["full_description"]
                print(f"  [~] Updated: {loc_data['id']}")

        db.commit()
        print("\n Seed complete.")
    except Exception as e:
        db.rollback()
        print(f"\n Seed failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
