import os
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from storage.cloudinary_storage import upload_scan_image

import bcrypt
import jwt
import pyotp
import google.generativeai as genai
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pymongo import MongoClient
from detection.nail_detection_service import analyze_nail_image

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-flash-latest")

client = MongoClient(os.getenv("MONGO_URI"))
db = client["nailscan"]
users = db.users
scans = db.scans
education = db.education

GOOGLE_WEB_CLIENT_ID = os.getenv("GOOGLE_WEB_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing from your .env file.")

TWO_FA_ISSUER = "Smart NailScan"

APP_GUIDE = """SMART NAILSCAN APP GUIDE (use this to answer "how do I..." questions; never invent screens or buttons that are not listed here)

Getting in:
- First launch shows 3 intro slides: swipe or tap Next, or tap Skip. Then the welcome screen appears.
- Welcome screen: tap "Get started" to create an account, or "Log in" if you already have one.
- Register: enter full name, email, password, confirm the password, tick the agreement box, tap "Create account".
- Log in: enter email and password and tap "Log in", or tap "Continue with Google" and pick an account. If two-factor authentication is on, a second step asks for the 6-digit code from the authenticator app.

Main screens (the bottom bar has 3 tabs: Home, Scan, Profile):
- Home: a greeting, a "Start a scan" card, and nail health tips. Pull down to refresh the tips. The bell icon at the top right opens notifications; the round photo or initials next to it opens Profile.
- Scan tab: opens the capture screen. Place the nail inside the dashed outline, keep it bare (no polish, nail art or artificial nails) and in even light, then tap the round shutter button. After "Analyzing..." the Results screen shows the detected condition with a confidence gauge. Tap "Save to history" to keep it. The back arrow leaves the screen.
- Profile tab: your photo, name, email, a condition breakdown, and your nail history (past scans). The gear icon at the top right opens a menu with Personal information, Security & privacy, Notifications, and Preferences. "Log out" is at the bottom of Profile.

Settings:
- Personal information (Profile > gear icon): tap "Change photo" to pick a picture from the gallery, edit your name or phone number, then tap "Save changes". The email cannot be changed.
- Security & privacy (Profile > gear icon > Security & privacy): change your password by entering the current password and a new one (at least 8 characters). Accounts created with Google can set a password here without a current password. A switch turns two-factor authentication on: add the setup key to an authenticator app such as Google Authenticator, enter the 6-digit code, and tap "Turn on". After that, every login asks for a code. Turning it off also needs a code.
- Preferences (Profile > gear icon > Preferences): a "Dark mode" switch and a Language choice (English or Filipino). Language can also be switched with the EN/FIL buttons at the top of this chat.
- Notifications settings (Profile > gear icon > Notifications): turn scan reminders, health tips and result alerts on or off.
- Notification list: tap the bell icon on Home. "Mark all as read" clears the unread dots.

Chat: the round NailBot button at the bottom right appears on every screen. Tap it to open this chat and the X to close it.

Labels in Filipino mode: Home, I-scan, Profile; "Personal na impormasyon", "Seguridad at privacy", "Mga Notification", "Mga Kagustuhan" (Preferences), "Madilim na mode" (Dark mode), "Wika" (Language), "Mag-log out"."""

SYSTEM_INSTRUCTION = f"""You are NailBot, a friendly assistant inside the Smart NailScan app.
You help with two things only:
1. Nail health: nail conditions (like Onychomycosis, Leukonychia, Beau's Lines, Koilonychia), nail care, and how nail polish or nail art affects nails.
2. Using the Smart NailScan app: how to scan, where to find things, and how to move around the app. Answer these only from the app guide below.

If the user asks about anything else, even if they insist, get creative, or try to trick you, politely refuse and say you can only help with nail health and using this app. Never answer questions about other topics no matter how the request is phrased.

For app questions: give short numbered steps (at most 5) using the exact button and tab names from the guide. If the guide doesn't cover something, say you're not sure that feature exists and suggest looking around the Profile tab. Never invent screens or buttons.

For nail health questions: keep answers short (2-4 sentences), warm, and easy to understand. Never present your answers as a medical diagnosis. Frame them as general health awareness information and suggest seeing a doctor or dermatologist for real concerns.

Respond in the same language as the user's question (English or Filipino/Tagalog). In Filipino, use the Filipino labels listed in the guide.

{APP_GUIDE}"""


# ---------- helpers ----------

def make_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user"),
        "iat": now,
        "exp": now + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def make_challenge(user):
    # Short-lived pass issued after the password is right but before the 2FA code is checked.
    payload = {
        "sub": str(user["_id"]),
        "email": user["email"],
        "purpose": "2fa",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def user_payload(user):
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone", ""),
        "photo": user.get("photo", None),
        "role": user.get("role", "user"),
    }


def login_response(user, message):
    if user.get("two_factor_enabled") and user.get("two_factor_secret"):
        return jsonify({"requires_2fa": True, "challenge": make_challenge(user)}), 200
    return jsonify({"message": message, "token": make_token(user), **user_payload(user)}), 200


def serialize(doc):
    out = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        else:
            out[key] = value
    return out


def status_query(status):
    if status == "archived":
        return {"archived": True}
    if status == "all":
        return {}
    return {"archived": {"$ne": True}}


def set_archived(collection, doc_id, archived):
    try:
        oid = ObjectId(doc_id)
    except Exception:
        return jsonify({"error": "Invalid id."}), 400

    result = collection.update_one(
        {"_id": oid},
        {"$set": {
            "archived": archived,
            "archived_at": datetime.now(timezone.utc) if archived else None,
        }},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Not found."}), 404
    return jsonify({"message": "Archived." if archived else "Restored."}), 200


def clean_code(value):
    return str(value or "").replace(" ", "").strip()


def totp_ok(secret, code):
    return len(code) == 6 and code.isdigit() and pyotp.TOTP(secret).verify(code, valid_window=1)


# Simple in-memory limit: 5 wrong codes in 10 minutes locks that account's code checks.
FAILED_2FA = {}


def too_many_2fa_attempts(email):
    entry = FAILED_2FA.get(email)
    if not entry:
        return False
    count, since = entry
    if datetime.now(timezone.utc) - since > timedelta(minutes=10):
        FAILED_2FA.pop(email, None)
        return False
    return count >= 5


def record_2fa_failure(email):
    now = datetime.now(timezone.utc)
    count, since = FAILED_2FA.get(email, (0, now))
    if now - since > timedelta(minutes=10):
        count, since = 0, now
    FAILED_2FA[email] = (count + 1, since)


def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Missing token."}), 401
        try:
            payload = jwt.decode(header[7:], JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        # A 2FA challenge pass must never work as a real login token.
        if payload.get("purpose"):
            return jsonify({"error": "Invalid token."}), 401

        user = users.find_one({"email": payload.get("email")})
        if not user or user.get("archived"):
            return jsonify({"error": "Account unavailable."}), 403

        changed = user.get("password_changed_at")
        if changed:
            if changed.tzinfo is None:
                changed = changed.replace(tzinfo=timezone.utc)
            if payload.get("iat", 0) < int(changed.timestamp()):
                return jsonify({"error": "Your password was changed. Please log in again."}), 401

        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    @token_required
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return jsonify({"error": "Admins only."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ---------- nail detection API ----------

@app.route("/api/detect-nails", methods=["POST"])
@token_required
def detect_nails_api():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    uploaded = request.files["image"]

    if not uploaded.filename:
        return jsonify({"error": "No image selected."}), 400

    image_bytes = uploaded.read()

    if not image_bytes:
        return jsonify({"error": "The uploaded image is empty."}), 400

    try:
        # Run YOLO detection only. Do not upload to Cloudinary here.
        result = analyze_nail_image(image_bytes)

        # Return a temporary ID for this scan.
        # It will be used if the user chooses to save the result.
        result["scan_id"] = str(uuid.uuid4())

        return jsonify(result), 200

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        app.logger.exception("Nail detection failed")
        return jsonify({
            "error": "Nail detection failed. Check the backend logs."
        }), 500


# ---------- save scan to history ----------
@app.route("/api/scans/save", methods=["POST"])
@token_required
def save_scan():
    import base64
    import binascii
    import cloudinary.uploader

    data = request.get_json(silent=True) or {}

    scan_id = str(data.get("scan_id") or "").strip()
    detections = data.get("detections", [])

    if not scan_id:
        return jsonify({"error": "Missing scan ID."}), 400

    if not isinstance(detections, list) or not detections:
        return jsonify({"error": "No detected nail images provided."}), 400

    user = g.current_user
    user_id = str(user["_id"])

    # Prevent duplicate saves.
    existing = scans.find_one({
        "scan_id": scan_id,
        "user_id": user_id,
    })

    if existing:
        return jsonify({
            "message": "This scan is already saved.",
            "scan_id": scan_id,
            "nail_count": existing.get("nail_count", 0),
        }), 200

    uploaded_images = []

    try:
        detections_for_db = []

        for index, detection in enumerate(detections, start=1):
            if not isinstance(detection, dict):
                continue

            normalized_image = detection.get("normalized_image")

            if not normalized_image:
                raise ValueError(
                    f"Missing normalized image for nail {index}."
                )

            # Accept a Base64 string or image data URI.
            encoded = normalized_image

            if encoded.strip().lower().startswith("data:"):
                if "," not in encoded:
                    raise ValueError(
                        f"Invalid image data URI for nail {index}."
                    )
                encoded = encoded.split(",", 1)[1]

            image_bytes = base64.b64decode(
                encoded,
                validate=True,
            )

            if not image_bytes:
                raise ValueError(
                    f"Empty image for nail {index}."
                )

            # Upload the individual normalized nail image.
            public_id = f"{user_id}_{scan_id}_nail_{index:02d}"

            uploaded = cloudinary.uploader.upload(
                image_bytes,
                folder="smartnailscan/nails",
                public_id=public_id,
                resource_type="image",
                overwrite=False,
            )

            uploaded_images.append(uploaded["public_id"])

            detections_for_db.append({
                "nail_number": index,
                "label": detection.get("label", "Nail"),
                "confidence": detection.get("confidence"),
                "box": detection.get("box"),
                "image_url": uploaded["secure_url"],
                "cloudinary_public_id": uploaded["public_id"],
            })

        if not detections_for_db:
            raise ValueError("No valid nail detections to save.")

        scan_document = {
            "scan_id": scan_id,
            "user_id": user_id,
            "user_email": user.get("email"),
            "image_width": data.get("image_width"),
            "image_height": data.get("image_height"),
            "nail_count": len(detections_for_db),
            "detections": detections_for_db,
            "condition": data.get("condition"),
            "archived": False,
            "created_at": datetime.now(timezone.utc),
        }

        scans.insert_one(scan_document)

        return jsonify({
            "message": "Cropped nail images saved to history.",
            "scan_id": scan_id,
            "nail_count": len(detections_for_db),
            "nails": [
                {
                    "nail_number": nail["nail_number"],
                    "image_url": nail["image_url"],
                    "confidence": nail["confidence"],
                }
                for nail in detections_for_db
            ],
        }), 201

    except (
        binascii.Error,
        ValueError,
        TypeError,
    ) as error:
        app.logger.warning("Invalid nail image data: %s", error)

        for public_id in uploaded_images:
            try:
                cloudinary.uploader.destroy(public_id)
            except Exception:
                app.logger.exception(
                    "Failed to clean up Cloudinary image %s",
                    public_id,
                )

        return jsonify({"error": str(error)}), 400

    except Exception:
        app.logger.exception("Saving cropped nail images failed")

        # Roll back uploaded images if the database save fails.
        for public_id in uploaded_images:
            try:
                cloudinary.uploader.destroy(public_id)
            except Exception:
                app.logger.exception(
                    "Cloudinary cleanup failed for %s",
                    public_id,
                )

        return jsonify({
            "error": "Could not save the nail images. Please try again."
        }), 500

@app.route("/api/scans/history", methods=["GET"])
@token_required
def get_scan_history():
    try:
        user_id = str(g.current_user["_id"])

        user_scans = list(
            scans.find({
                "user_id": user_id,
                "archived": False
            }).sort("created_at", -1)
        )

        results = []

        for scan in user_scans:
            results.append({
                "_id": str(scan["_id"]),
                "scan_id": scan.get("scan_id"),
                "created_at": (
                    scan["created_at"].isoformat()
                    if scan.get("created_at")
                    else None
                ),
                "nail_count": scan.get("nail_count", 0),
                "condition": scan.get("condition"),
                "detections": scan.get("detections", [])
            })

        return jsonify({"scans": results}), 200

    except Exception:
        app.logger.exception("Failed to load scan history")
        return jsonify({
            "error": "Failed to load scan history."
        }), 500
# ---------- chatbot ----------

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "").strip()
    language = data.get("language", "en")

    if not message:
        return jsonify({"error": "No message provided."}), 400

    try:
        response = gemini_model.generate_content(
            f"{SYSTEM_INSTRUCTION}\n\nUser's language preference: {language}\n\nUser question: {message}"
        )
        answer = response.text.strip()
        return jsonify({"answer": answer}), 200
    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": "Couldn't reach the AI right now."}), 500


# ---------- accounts ----------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email", "").strip().lower()
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are all required."}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "An account with that email already exists."}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    users.insert_one({
        "name": name,
        "email": email,
        "password": hashed,
        "role": "user",
        "archived": False,
        "created_at": datetime.now(timezone.utc),
    })
    user = users.find_one({"email": email})

    return jsonify({"message": "Account created.", "token": make_token(user), **user_payload(user)}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password") or ""

    user = users.find_one({"email": email})
    if not user or not user.get("password"):
        return jsonify({"error": "Invalid email or password."}), 401
    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid email or password."}), 401
    if user.get("archived"):
        return jsonify({"error": "This account has been archived. Please contact an administrator."}), 403

    return login_response(user, "Login successful.")


@app.route("/api/login/2fa", methods=["POST"])
def login_2fa():
    data = request.get_json() or {}
    try:
        payload = jwt.decode(data.get("challenge", ""), JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "That sign-in expired. Please log in again."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid sign-in. Please log in again."}), 401

    if payload.get("purpose") != "2fa":
        return jsonify({"error": "Invalid sign-in. Please log in again."}), 401

    user = users.find_one({"email": payload.get("email")})
    if not user or not user.get("two_factor_enabled") or not user.get("two_factor_secret"):
        return jsonify({"error": "Invalid sign-in. Please log in again."}), 401
    if user.get("archived"):
        return jsonify({"error": "This account has been archived. Please contact an administrator."}), 403

    email = user["email"]
    if too_many_2fa_attempts(email):
        return jsonify({"error": "Too many wrong codes. Please wait 10 minutes and try again."}), 429

    code = clean_code(data.get("code"))
    if not totp_ok(user["two_factor_secret"], code):
        record_2fa_failure(email)
        return jsonify({"error": "That code isn't right. Check your authenticator app and try again."}), 400

    FAILED_2FA.pop(email, None)
    return jsonify({"message": "Login successful.", "token": make_token(user), **user_payload(user)}), 200


@app.route("/api/google-login", methods=["POST"])
def google_login():
    try:
        data = request.get_json()
        token = data.get("idToken")

        if not token:
            return jsonify({"error": "Missing Google ID token."}), 400

        payload = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_WEB_CLIENT_ID
        )

        email = payload.get("email", "").strip().lower()
        name = payload.get("name", "")
        picture = payload.get("picture", None)

        if not email:
            return jsonify({"error": "Google account has no email."}), 400

        user = users.find_one({"email": email})
        if not user:
            users.insert_one({
                "name": name,
                "email": email,
                "password": None,
                "auth_provider": "google",
                "photo": picture,
                "role": "user",
                "archived": False,
                "created_at": datetime.now(timezone.utc),
            })
            user = users.find_one({"email": email})

        if user.get("archived"):
            return jsonify({"error": "This account has been archived. Please contact an administrator."}), 403

        return login_response(user, "Google login successful.")

    except ValueError as e:
        print("Google token verification failed:", e)
        return jsonify({"error": f"Invalid Google token: {e}"}), 401
    except Exception as e:
        print("Google login error:", repr(e))
        return jsonify({"error": f"Server error: {e}"}), 500


@app.route("/api/profile", methods=["PATCH"])
@token_required
def update_profile():
    data = request.get_json() or {}

    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "phone" in data:
        update_fields["phone"] = data["phone"]
    if "photo" in data:
        update_fields["photo"] = data["photo"]

    if not update_fields:
        return jsonify({"error": "Nothing to update."}), 400

    users.update_one({"_id": g.current_user["_id"]}, {"$set": update_fields})
    updated = users.find_one({"_id": g.current_user["_id"]})
    return jsonify({"message": "Profile updated.", **user_payload(updated)}), 200


# ---------- security & privacy ----------

@app.route("/api/security/status", methods=["GET"])
@token_required
def security_status():
    user = g.current_user
    return jsonify({
        "has_password": bool(user.get("password")),
        "two_factor_enabled": bool(user.get("two_factor_enabled")),
    }), 200


@app.route("/api/security/password", methods=["POST"])
@token_required
def change_password():
    data = request.get_json() or {}
    current = data.get("current_password") or ""
    new = data.get("new_password") or ""
    user = g.current_user

    if len(new) < 8:
        return jsonify({"error": "The new password must be at least 8 characters."}), 400

    if user.get("password"):
        if not bcrypt.checkpw(current.encode("utf-8"), user["password"]):
            return jsonify({"error": "Your current password is wrong."}), 400
        if bcrypt.checkpw(new.encode("utf-8"), user["password"]):
            return jsonify({"error": "Choose a password different from your current one."}), 400

    hashed = bcrypt.hashpw(new.encode("utf-8"), bcrypt.gensalt())
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed, "password_changed_at": datetime.now(timezone.utc)}},
    )
    updated = users.find_one({"_id": user["_id"]})
    # Older tokens (other devices) stop working; this device gets a fresh one.
    return jsonify({"message": "Password updated.", "token": make_token(updated)}), 200


@app.route("/api/security/2fa/setup", methods=["POST"])
@token_required
def two_factor_setup():
    user = g.current_user
    if user.get("two_factor_enabled"):
        return jsonify({"error": "Two-factor authentication is already on."}), 400

    secret = pyotp.random_base32()
    users.update_one({"_id": user["_id"]}, {"$set": {"two_factor_pending_secret": secret}})
    uri = pyotp.TOTP(secret).provisioning_uri(name=user["email"], issuer_name=TWO_FA_ISSUER)
    return jsonify({"secret": secret, "otpauth_uri": uri}), 200


@app.route("/api/security/2fa/enable", methods=["POST"])
@token_required
def two_factor_enable():
    user = g.current_user
    secret = user.get("two_factor_pending_secret")
    if not secret:
        return jsonify({"error": "Start the setup first."}), 400

    code = clean_code((request.get_json() or {}).get("code"))
    if not totp_ok(secret, code):
        return jsonify({"error": "That code isn't right. Check your authenticator app and try again."}), 400

    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"two_factor_enabled": True, "two_factor_secret": secret},
         "$unset": {"two_factor_pending_secret": ""}},
    )
    return jsonify({"message": "Two-factor authentication is on."}), 200


@app.route("/api/security/2fa/disable", methods=["POST"])
@token_required
def two_factor_disable():
    user = g.current_user
    if not user.get("two_factor_enabled") or not user.get("two_factor_secret"):
        return jsonify({"error": "Two-factor authentication is already off."}), 400

    email = user["email"]
    if too_many_2fa_attempts(email):
        return jsonify({"error": "Too many wrong codes. Please wait 10 minutes and try again."}), 429

    code = clean_code((request.get_json() or {}).get("code"))
    if not totp_ok(user["two_factor_secret"], code):
        record_2fa_failure(email)
        return jsonify({"error": "That code isn't right. Check your authenticator app and try again."}), 400

    FAILED_2FA.pop(email, None)
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"two_factor_enabled": False},
         "$unset": {"two_factor_secret": "", "two_factor_pending_secret": ""}},
    )
    return jsonify({"message": "Two-factor authentication is off."}), 200


# ---------- educational content (public read) ----------

@app.route("/api/education", methods=["GET"])
def public_education():
    docs = education.find({"archived": {"$ne": True}}).sort("created_at", 1)
    return jsonify([serialize(d) for d in docs]), 200


# ---------- admin: overview ----------

@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    active = {"archived": {"$ne": True}}
    breakdown = list(scans.aggregate([
        {"$match": active},
        {"$group": {"_id": "$condition", "count": {"$sum": 1}}},
    ]))
    return jsonify({
        "users_active": users.count_documents(active),
        "users_archived": users.count_documents({"archived": True}),
        "scans_active": scans.count_documents(active),
        "scans_archived": scans.count_documents({"archived": True}),
        "education_active": education.count_documents(active),
        "education_archived": education.count_documents({"archived": True}),
        "condition_breakdown": [
            {"condition": b["_id"] or "Unknown", "count": b["count"]} for b in breakdown
        ],
    }), 200


# ---------- admin: users (archive / restore, never delete) ----------

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_list_users():
    query = status_query(request.args.get("status", "active"))
    hidden = {"password": 0, "photo": 0, "two_factor_secret": 0, "two_factor_pending_secret": 0}
    docs = users.find(query, hidden).sort("name", 1)
    return jsonify([serialize(d) for d in docs]), 200


@app.route("/api/admin/users/<doc_id>/archive", methods=["POST"])
@admin_required
def archive_user(doc_id):
    if str(g.current_user["_id"]) == doc_id:
        return jsonify({"error": "You can't archive your own account."}), 400
    return set_archived(users, doc_id, True)


@app.route("/api/admin/users/<doc_id>/restore", methods=["POST"])
@admin_required
def restore_user(doc_id):
    return set_archived(users, doc_id, False)


# ---------- admin: scan records (archive / restore, never delete) ----------

@app.route("/api/admin/scans", methods=["GET"])
@admin_required
def admin_list_scans():
    query = status_query(request.args.get("status", "active"))
    docs = scans.find(query, {"image": 0}).sort("created_at", -1)
    return jsonify([serialize(d) for d in docs]), 200


@app.route("/api/admin/scans/<doc_id>/archive", methods=["POST"])
@admin_required
def archive_scan(doc_id):
    return set_archived(scans, doc_id, True)


@app.route("/api/admin/scans/<doc_id>/restore", methods=["POST"])
@admin_required
def restore_scan(doc_id):
    return set_archived(scans, doc_id, False)


# ---------- admin: educational content (archive / restore, never delete) ----------

EDU_FIELDS = ["title", "description", "title_fil", "description_fil"]


@app.route("/api/admin/education", methods=["GET"])
@admin_required
def admin_list_education():
    query = status_query(request.args.get("status", "active"))
    docs = education.find(query).sort("created_at", 1)
    return jsonify([serialize(d) for d in docs]), 200


@app.route("/api/admin/education", methods=["POST"])
@admin_required
def create_education():
    data = request.get_json() or {}
    if not data.get("title") or not data.get("description"):
        return jsonify({"error": "Title and description are required."}), 400

    doc = {f: data.get(f, "") for f in EDU_FIELDS}
    doc.update({"archived": False, "created_at": datetime.now(timezone.utc)})
    result = education.insert_one(doc)
    return jsonify({"message": "Created.", "id": str(result.inserted_id)}), 201


@app.route("/api/admin/education/<doc_id>", methods=["PATCH"])
@admin_required
def update_education(doc_id):
    data = request.get_json() or {}
    fields = {f: data[f] for f in EDU_FIELDS if f in data}
    if not fields:
        return jsonify({"error": "Nothing to update."}), 400

    try:
        oid = ObjectId(doc_id)
    except Exception:
        return jsonify({"error": "Invalid id."}), 400

    result = education.update_one({"_id": oid}, {"$set": fields})
    if result.matched_count == 0:
        return jsonify({"error": "Not found."}), 404
    return jsonify({"message": "Updated."}), 200


@app.route("/api/admin/education/<doc_id>/archive", methods=["POST"])
@admin_required
def archive_education(doc_id):
    return set_archived(education, doc_id, True)


@app.route("/api/admin/education/<doc_id>/restore", methods=["POST"])
@admin_required
def restore_education(doc_id):
    return set_archived(education, doc_id, False)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)