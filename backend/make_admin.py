import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

if len(sys.argv) < 2:
    print("Usage: python make_admin.py someone@email.com")
    sys.exit(1)

email = sys.argv[1].strip().lower()
users = MongoClient(os.getenv("MONGO_URI"))["nailscan"].users
result = users.update_one({"email": email}, {"$set": {"role": "admin"}})
print("Promoted to admin." if result.matched_count else "No user found with that email.")