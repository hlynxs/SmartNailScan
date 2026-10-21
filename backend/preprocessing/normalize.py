
from pathlib import Path
import cv2
import numpy as np


def normalize_image(input_path, output_path, size=(224, 224)):
    input_path = Path(input_path)
    output_path = Path(output_path)

    image = cv2.imread(str(input_path))
    if image is None:
        raise ValueError(f"Could not read image: {input_path}")

    # Preserve the original aspect ratio
    target_width, target_height = size
    height, width = image.shape[:2]

    scale = min(target_width / width, target_height / height)
    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))

    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
    )

    # Gentle brightness adjustment only
    brightness_offset = 5
    brightened = cv2.convertScaleAbs(
        resized, alpha=1.0, beta=brightness_offset
    )

    # Pad to 224x224 without stretching
    pad_width = target_width - new_width
    pad_height = target_height - new_height

    left = pad_width // 2
    right = pad_width - left
    top = pad_height // 2
    bottom = pad_height - top

    normalized = cv2.copyMakeBorder(
    brightened,
    top, bottom, left, right,
    cv2.BORDER_CONSTANT,
    value=(0, 0, 0)
)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not cv2.imwrite(str(output_path), normalized):
        raise IOError(f"Could not save image: {output_path}")

    return output_path
