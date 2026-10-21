
import os
from pathlib import Path
from io import BytesIO

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Locate the .env file inside the backend folder.
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(ENV_PATH, override=True)

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

if not all([cloud_name, api_key, api_secret]):
    raise RuntimeError(
        f"Cloudinary credentials are missing. Check: {ENV_PATH}"
    )

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True,
)


def upload_scan_image(image_bytes, user_id, scan_id):
    """Upload an original scan image to Cloudinary."""

    uploaded = cloudinary.uploader.upload(
        BytesIO(image_bytes),
        folder="smartnailscan/scans",
        public_id=f"{user_id}_{scan_id}",
        resource_type="image",
        overwrite=False,
    )

    return {
        "image_url": uploaded["secure_url"],
        "public_id": uploaded["public_id"],
    }
