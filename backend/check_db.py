from database import SessionLocal
import models

db = SessionLocal()
locations = db.query(models.Location).all()
print(f"Total locations in DB: {len(locations)}")
for loc in locations:
    print(f"- {loc.id}: {loc.name}")
db.close()
