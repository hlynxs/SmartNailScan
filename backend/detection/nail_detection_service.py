
import base64
import uuid
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = PROJECT_ROOT / "models" / "nail_detector" / "best.pt"
RESULTS_DIR = PROJECT_ROOT / "results" / "nail_detection"
CROPPED_DIR = RESULTS_DIR / "cropped_nails"
NORMALIZED_DIR = RESULTS_DIR / "normalized_nails"

CONFIDENCE_THRESHOLD = 0.10
IMAGE_SIZE = 512
PADDING_RATIO = 0.10
NORMALIZED_SIZE = (224, 224)


# Load the model once when this module is imported.
if not MODEL_PATH.is_file():
    raise FileNotFoundError(f"Nail detection model not found: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

RESULTS_DIR.mkdir(parents=True, exist_ok=True)
CROPPED_DIR.mkdir(parents=True, exist_ok=True)
NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)


def normalize_nail_crop(image, size=NORMALIZED_SIZE):
    target_width, target_height = size
    height, width = image.shape[:2]

    scale = min(target_width / width, target_height / height)
    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))

    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC,
    )

    brightened = cv2.convertScaleAbs(resized, alpha=1.0, beta=5)

    pad_width = target_width - new_width
    pad_height = target_height - new_height

    left = pad_width // 2
    right = pad_width - left
    top = pad_height // 2
    bottom = pad_height - top

    return cv2.copyMakeBorder(
        brightened,
        top,
        bottom,
        left,
        right,
        cv2.BORDER_CONSTANT,
        value=(0, 0, 0),
    )


def analyze_nail_image(image_bytes):
    """Detect nails, save crops and normalized images, and return results."""

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("The uploaded file is not a valid image.")

    height, width = image.shape[:2]
    result_id = uuid.uuid4().hex

    predictions = model.predict(
        source=image,
        conf=CONFIDENCE_THRESHOLD,
        imgsz=IMAGE_SIZE,
        verbose=False,
    )

    result = predictions[0]
    preview = image.copy()
    detections = []
    boxes = []

    if result.boxes is not None:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            boxes.append((x1, y1, x2, y2, confidence))

    # Sort top to bottom, then left to right.
    boxes.sort(key=lambda b: ((b[1] + b[3]) / 2, (b[0] + b[2]) / 2))

    for index, (x1, y1, x2, y2, confidence) in enumerate(boxes, start=1):
        padding_x = (x2 - x1) * PADDING_RATIO
        padding_y = (y2 - y1) * PADDING_RATIO

        crop_x1 = max(0, int(x1 - padding_x))
        crop_y1 = max(0, int(y1 - padding_y))
        crop_x2 = min(width, int(x2 + padding_x))
        crop_y2 = min(height, int(y2 + padding_y))

        crop = image[crop_y1:crop_y2, crop_x1:crop_x2]

        if crop.size == 0:
            continue

        crop_path = CROPPED_DIR / f"{result_id}_nail_{index:02d}.jpg"
        normalized_path = NORMALIZED_DIR / f"{result_id}_nail_{index:02d}.jpg"

        # Save the original cropped nail.
        if not cv2.imwrite(str(crop_path), crop):
            raise RuntimeError(f"Could not save crop for nail {index}")

        # Normalize and save the nail.
        normalized = normalize_nail_crop(crop)

        if not cv2.imwrite(str(normalized_path), normalized):
            raise RuntimeError(f"Could not save normalized nail {index}")

        # Draw the detection box on the preview.
        cv2.rectangle(
            preview,
            (int(x1), int(y1)),
            (int(x2), int(y2)),
            (0, 255, 0),
            2,
        )
        cv2.putText(
            preview,
            f"Nail {index}: {confidence:.1%}",
            (int(x1), max(int(y1) - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2,
        )

        # Encode ONLY the normalized nail image for the mobile app.
        normalized_success, normalized_encoded = cv2.imencode(
            ".jpg", normalized
        )

        if not normalized_success:
            raise RuntimeError(
                f"Could not encode normalized image for nail {index}"
            )

        detections.append({
            "label": "Nail",
            "confidence": round(confidence, 4),
            "box": {
                "x1": round(x1, 2),
                "y1": round(y1, 2),
                "x2": round(x2, 2),
                "y2": round(y2, 2),
            },
            "normalized_image": (
                "data:image/jpeg;base64,"
                + base64.b64encode(
                    normalized_encoded.tobytes()
                ).decode("ascii")
            ),
        })

    return {
        "image_width": width,
        "image_height": height,
        "nail_count": len(detections),
        "detections": detections,
    }
