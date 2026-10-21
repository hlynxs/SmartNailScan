from pathlib import Path
from ultralytics import YOLO
import shutil


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATASET_YAML = PROJECT_ROOT / "datasets" / "nail_detection" / "data.yaml"

MODEL_OUTPUT_DIR = PROJECT_ROOT / "models" / "nail_detector"

RUNS_DIR = PROJECT_ROOT / "runs"


# ============================================================
# SETTINGS
# ============================================================

EPOCHS = 50
IMAGE_SIZE = 512
BATCH_SIZE = 8


# ============================================================
# CHECK DATASET
# ============================================================

if not DATASET_YAML.exists():
    raise FileNotFoundError(
        f"Dataset YAML not found:\n{DATASET_YAML}"
    )


print("========================================")
print("SMARTNAILSCAN - NAIL DETECTOR TRAINING")
print("========================================")

print(f"\nDataset:")
print(DATASET_YAML)

print(f"\nEpochs: {EPOCHS}")
print(f"Image size: {IMAGE_SIZE}")
print(f"Batch size: {BATCH_SIZE}")


# ============================================================
# LOAD YOLOv8 MODEL
# ============================================================

print("\nLoading YOLOv8n...")

model = YOLO("yolov8n.pt")


# ============================================================
# TRAIN
# ============================================================

print("\nStarting training...\n")

results = model.train(
    data=str(DATASET_YAML),

    epochs=EPOCHS,

    imgsz=IMAGE_SIZE,

    batch=BATCH_SIZE,

    project=str(RUNS_DIR),

    name="nail_detector",

    exist_ok=True,

    pretrained=True,

    patience=10,

    workers=0,

    verbose=True
)


# ============================================================
# FIND BEST MODEL
# ============================================================

best_model = RUNS_DIR / "detect" / "nail_detector" / "weights" / "best.pt"

if not best_model.exists():
    raise FileNotFoundError(
        f"\nTraining completed, but best.pt was not found:\n{best_model}"
    )


# ============================================================
# SAVE MODEL TO MODELS FOLDER
# ============================================================

MODEL_OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

final_model = MODEL_OUTPUT_DIR / "best.pt"

shutil.copy2(
    best_model,
    final_model
)


# ============================================================
# DONE
# ============================================================

print("\n========================================")
print("TRAINING COMPLETE")
print("========================================")

print(f"\nBest model:")
print(final_model)

print("\nYou can now use this model for:")
print("Detection → Cropping → Normalization")