
from pathlib import Path

import cv2
from ultralytics import YOLO


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "models" / "nail_detector" / "best.pt"
RESULTS_DIR = PROJECT_ROOT / "results" / "nail_detection"

RESULTS_DIR.mkdir(parents=True, exist_ok=True)

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"YOLO model not found: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


def detect_nails(image_path, confidence=0.25):
    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(f"Input image not found: {image_path}")

    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError("The uploaded file could not be read as an image.")

    results = model.predict(
        source=image,
        conf=confidence,
        verbose=False,
    )

    result = results[0]
    detections = []

    if result.boxes is not None:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            score = float(box.conf[0])

            detections.append({
                "label": "Nail",
                "confidence": round(score, 4),
                "box": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                },
            })

    annotated = result.plot()
    output_path = RESULTS_DIR / f"{image_path.stem}_detected.jpg"

    if not cv2.imwrite(str(output_path), annotated):
        raise RuntimeError("Failed to save the annotated detection image.")

    return {
        "image_width": int(result.orig_shape[1]),
        "image_height": int(result.orig_shape[0]),
        "nail_count": len(detections),
        "detections": detections,
        "annotated_image_path": str(output_path),
    }


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="Path to the input hand or foot image")
    parser.add_argument("--conf", type=float, default=0.25)
    args = parser.parse_args()

    output = detect_nails(args.image, confidence=args.conf)
    print(json.dumps(output, indent=2))
