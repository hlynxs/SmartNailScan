
from pathlib import Path

import cv2
from ultralytics import YOLO

from backend.preprocessing.normalize import normalize_image


# ==========================================
# PROJECT PATHS
# ==========================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT / "models" / "nail_detector" / "best.pt"
)

# Input image: change this filename when testing another image
IMAGE_PATH = (
    PROJECT_ROOT / "backend" / "uploads" / "test_hand.jpg"
)

RESULTS_DIR = PROJECT_ROOT / "results" / "nail_detection"
CROPPED_DIR = RESULTS_DIR / "cropped_nails"
NORMALIZED_DIR = RESULTS_DIR / "normalized_nails"

PREVIEW_PATH = RESULTS_DIR / "detection_preview.jpg"


# ==========================================
# DETECTION SETTINGS
# ==========================================

CONFIDENCE_THRESHOLD = 0.10
PADDING_RATIO = 0.10
NORMALIZED_SIZE = (224, 224)


def main():
    # Check required files
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"YOLO model not found:\n{MODEL_PATH}"
        )

    if not IMAGE_PATH.exists():
        raise FileNotFoundError(
            f"Input image not found:\n{IMAGE_PATH}"
        )

    CROPPED_DIR.mkdir(parents=True, exist_ok=True)
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    # Load model and input image
    print("Loading SmartNailScan nail detector...")
    model = YOLO(str(MODEL_PATH))

    image = cv2.imread(str(IMAGE_PATH))

    if image is None:
        raise ValueError(
            f"Could not read input image:\n{IMAGE_PATH}"
        )

    image_height, image_width = image.shape[:2]
    preview = image.copy()

    print(f"Input image: {IMAGE_PATH}")
    print("Detecting nails...")

    results = model.predict(
        source=image,
        conf=CONFIDENCE_THRESHOLD,
        imgsz=512,
        verbose=False
    )

    result = results[0]
    boxes = result.boxes

    if boxes is None or len(boxes) == 0:
        print("No nails detected.")
        return

    # Sort detections roughly from top to bottom, then left to right
    detections = []

    for box in boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        confidence = float(box.conf[0])

        detections.append(
            (x1, y1, x2, y2, confidence)
        )

    detections.sort(
        key=lambda item: (
            (item[1] + item[3]) / 2,
            (item[0] + item[2]) / 2
        )
    )

    print(f"\nDetected nails: {len(detections)}")

    saved_count = 0

    for index, detection in enumerate(detections, start=1):
        x1, y1, x2, y2, confidence = detection

        # Add padding so the crop doesn't cut off nail edges
        width = x2 - x1
        height = y2 - y1

        padding_x = width * PADDING_RATIO
        padding_y = height * PADDING_RATIO

        x1 = max(0, int(x1 - padding_x))
        y1 = max(0, int(y1 - padding_y))
        x2 = min(image_width, int(x2 + padding_x))
        y2 = min(image_height, int(y2 + padding_y))

        nail_crop = image[y1:y2, x1:x2]

        if nail_crop.size == 0:
            print(f"Skipping nail {index}: empty crop")
            continue

        cropped_path = CROPPED_DIR / f"nail_{index:02d}.jpg"
        normalized_path = (
            NORMALIZED_DIR /
            f"nail_{index:02d}_normalized.jpg"
        )

        # Save original crop
        if not cv2.imwrite(str(cropped_path), nail_crop):
            print(f"Could not save crop for nail {index}")
            continue

        # Normalize the crop
        normalize_image(
            cropped_path,
            normalized_path,
            size=NORMALIZED_SIZE
        )

        # Draw bounding box and confidence on preview
        cv2.rectangle(
            preview,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        label = f"Nail {index}: {confidence:.2f}"

        cv2.putText(
            preview,
            label,
            (x1, max(y1 - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2
        )

        saved_count += 1

        print(
            f"Nail {index}: confidence {confidence:.1%}"
        )
        print(f"  Crop:       {cropped_path}")
        print(f"  Normalized: {normalized_path}")

    # Save annotated preview
    cv2.imwrite(str(PREVIEW_PATH), preview)

    print("\n====================================")
    print("NAIL PROCESSING COMPLETE")
    print("====================================")
    print(f"Successfully processed: {saved_count}")
    print(f"Detection preview: {PREVIEW_PATH}")
    print(f"Cropped nails: {CROPPED_DIR}")
    print(f"Normalized nails: {NORMALIZED_DIR}")


if __name__ == "__main__":
    main()
