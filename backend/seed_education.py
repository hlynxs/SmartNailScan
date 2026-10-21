import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
education = MongoClient(os.getenv("MONGO_URI"))["nailscan"].education

if education.count_documents({}) > 0:
    print("The education collection already has topics. Nothing inserted.")
    raise SystemExit

topics = [
    {
        "title": "Onychomycosis",
        "description": "A fungal infection that can thicken, discolor, or crumble the nail over time.",
        "title_fil": "Onychomycosis",
        "description_fil": "Impeksiyong fungal ng kuko na maaaring magpakapal, magpakulay, o magpalagas sa kuko sa paglipas ng panahon.",
    },
    {
        "title": "Leukonychia",
        "description": "White spots or streaks in the nail, often from minor trauma to the nail bed.",
        "title_fil": "Leukonychia",
        "description_fil": "Mga puting batik o guhit sa kuko, kadalasang dulot ng maliit na trauma sa nail bed.",
    },
    {
        "title": "Beau's lines",
        "description": "Horizontal ridges that can follow illness, injury, or nutritional changes.",
        "title_fil": "Beau's lines",
        "description_fil": "Mga pahalang na guhit sa kuko na maaaring sumunod sa sakit, injury, o pagbabago sa nutrisyon.",
    },
    {
        "title": "Koilonychia",
        "description": "A spoon-shaped nail that curves inward, sometimes linked to iron levels.",
        "title_fil": "Koilonychia",
        "description_fil": "Kuko na hugis-kutsara na kumukurba paloob, minsan may kaugnayan sa antas ng iron.",
    },
    {
        "title": "Nail polish and nail art",
        "description": "Frequent use without breaks can trap moisture and weaken the nail plate.",
        "title_fil": "Nail polish at nail art",
        "description_fil": "Ang madalas na paggamit nang walang pahinga ay maaaring magpanatili ng moisture at magpahina sa nail plate.",
    },
]

now = datetime.now(timezone.utc)
for i, t in enumerate(topics):
    t["archived"] = False
    t["created_at"] = now + timedelta(seconds=i)

education.insert_many(topics)
print("Inserted", len(topics), "education topics.")