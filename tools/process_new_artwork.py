from __future__ import annotations

from pathlib import Path
from shutil import copy2

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ARTWORK_DIR = ROOT / "assets" / "artwork"
BACKUP_DIR = ARTWORK_DIR / "_originals_pxl"
EDGE_TRIM = 0.03
MAX_SMART_TRIM = 0.22

# Positive values rotate counter-clockwise. The list is intentionally manual:
# these were the pieces where the content, labels, or school forms were clearly sideways.
MANUAL_ROTATIONS = {
    "PXL_20260508_183226931.jpg": -90,
    "PXL_20260508_183309679.jpg": 90,
    "PXL_20260508_183331569.jpg": 90,
    "PXL_20260508_183355358.jpg": 90,
    "PXL_20260508_183726845.jpg": 90,
    "PXL_20260508_183741985.jpg": 90,
    "PXL_20260508_183803253.jpg": 90,
    "PXL_20260508_183813500.jpg": 90,
    "PXL_20260508_183836784.jpg": 90,
    "PXL_20260508_183846050.jpg": 90,
    "PXL_20260508_190013896.jpg": 90,
    "PXL_20260508_190126665.jpg": 90,
    "PXL_20260508_190137718.jpg": 90,
    "PXL_20260508_190147832.jpg": 90,
    "PXL_20260508_190157155.jpg": 90,
    "PXL_20260508_190206592.jpg": 90,
    "PXL_20260508_190249325.jpg": 180,
    "PXL_20260508_190303716.jpg": 90,
    "PXL_20260508_190320087.jpg": 90,
    "PXL_20260508_190331081.jpg": 90,
    "PXL_20260508_190734646.jpg": 90,
    "PXL_20260508_190931552.jpg": 90,
    "PXL_20260508_191621159.jpg": 90,
    "PXL_20260508_191627650.jpg": 90,
    "PXL_20260508_191645420.jpg": 90,
    "PXL_20260508_191722680.jpg": 90,
    "PXL_20260508_191728121.jpg": 180,
    "PXL_20260508_191734041.jpg": 180,
    "PXL_20260508_191740281.jpg": 90,
    "PXL_20260508_191746900.jpg": 90,
    "PXL_20260508_191753086.jpg": 90,
    "PXL_20260508_191759895.jpg": 90,
    "PXL_20260508_192055351.jpg": 90,
    "PXL_20260508_192323946.jpg": 90,
    "PXL_20260508_194047947.jpg": 90,
    "PXL_20260508_194054305.jpg": 90,
    "PXL_20260508_194149995.jpg": 90,
    "PXL_20260508_194208596.jpg": 90,
    "PXL_20260508_194221054.jpg": 90,
    "PXL_20260508_194235056.jpg": 90,
    "PXL_20260508_194237833.jpg": 90,
    "PXL_20260508_194243577.jpg": 90,
    "PXL_20260508_194247593.jpg": 90,
    "PXL_20260508_194254406.jpg": 90,
    "PXL_20260508_194317919.jpg": 90,
    "PXL_20260508_194328271.jpg": 90,
    "PXL_20260508_194337009.jpg": 90,
    "PXL_20260508_194351292.jpg": 90,
    "PXL_20260508_194428374.jpg": 90,
    "PXL_20260508_194437790.jpg": 90,
    "PXL_20260508_194459959.jpg": 90,
    "PXL_20260508_194507789.jpg": 90,
    "PXL_20260508_194519477.jpg": 90,
    "PXL_20260508_194529605.jpg": 90,
    "PXL_20260508_194610603.jpg": 90,
    "1000001839.jpg": 90,
    "1000001840.jpg": 90,
    "1000001841.jpg": 90,
    "1000001842.jpg": 90,
    "1000001847.jpg": 90,
    "1000001865.jpg": -90,
    "1000001866.jpg": 90,
    "1000001867.jpg": 90,
    "1000001869.jpg": 90,
    "1000001870.jpg": 180,
    "1000001871.jpg": 90,
    "1000001872.jpg": 90,
    "1000001874.jpg": 90,
    "1000001875.jpg": 90,
}


def crop_image(image: Image.Image) -> Image.Image:
    trim_x = int(image.width * EDGE_TRIM)
    trim_y = int(image.height * EDGE_TRIM)
    if trim_x < 8 or trim_y < 8:
        return image
    return image.crop((trim_x, trim_y, image.width - trim_x, image.height - trim_y))


def smart_crop(image: Image.Image) -> Image.Image:
    """Crop obvious countertop margins while refusing aggressive cuts."""
    small = image.copy()
    small.thumbnail((720, 720))
    rgb = small.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()

    edge_samples = []
    step = max(1, min(width, height) // 80)
    edge = max(3, min(width, height) // 35)
    for x in range(0, width, step):
        for y in range(edge):
            edge_samples.append(pixels[x, y])
            edge_samples.append(pixels[x, height - 1 - y])
    for y in range(0, height, step):
        for x in range(edge):
            edge_samples.append(pixels[x, y])
            edge_samples.append(pixels[width - 1 - x, y])

    if not edge_samples:
        return crop_image(image)

    channels = list(zip(*edge_samples))
    background = tuple(sorted(channel)[len(channel) // 2] for channel in channels)
    threshold = 42
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(0, height, 2):
        for x in range(0, width, 2):
            r, g, b = pixels[x, y]
            distance = abs(r - background[0]) + abs(g - background[1]) + abs(b - background[2])
            if distance > threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if min_x >= max_x or min_y >= max_y:
        return crop_image(image)

    scale_x = image.width / width
    scale_y = image.height / height
    margin_x = int(image.width * 0.025)
    margin_y = int(image.height * 0.025)
    box = (
        max(0, int(min_x * scale_x) - margin_x),
        max(0, int(min_y * scale_y) - margin_y),
        min(image.width, int(max_x * scale_x) + margin_x),
        min(image.height, int(max_y * scale_y) + margin_y),
    )
    left_trim = box[0] / image.width
    top_trim = box[1] / image.height
    right_trim = (image.width - box[2]) / image.width
    bottom_trim = (image.height - box[3]) / image.height
    trims = (left_trim, top_trim, right_trim, bottom_trim)

    if max(trims) > MAX_SMART_TRIM:
        return crop_image(image)
    if box[2] - box[0] < image.width * 0.58 or box[3] - box[1] < image.height * 0.58:
        return crop_image(image)
    if all(trim < EDGE_TRIM for trim in trims):
        return crop_image(image)
    return image.crop(box)


def process_file(path: Path) -> None:
    BACKUP_DIR.mkdir(exist_ok=True)
    backup = BACKUP_DIR / path.name
    if not backup.exists():
        copy2(path, backup)

    path.chmod(0o666)

    source_path = backup if backup.exists() else path
    with Image.open(source_path) as image:
        cleaned = ImageOps.exif_transpose(image).convert("RGB")
        rotation = MANUAL_ROTATIONS.get(path.name)
        if rotation:
            cleaned = cleaned.rotate(rotation, expand=True)
        cleaned = smart_crop(cleaned)
        temp_path = path.with_suffix(".tmp.jpg")
        cleaned.save(temp_path, quality=92, optimize=True)
        temp_path.chmod(0o666)
        temp_path.replace(path)


def main() -> None:
    patterns = ("PXL_*.jpg", "100000*.jpg")
    targets = sorted(
        path
        for pattern in patterns
        for path in ARTWORK_DIR.glob(pattern)
        if ".tmp." not in path.name
    )
    rotated = 0
    for path in targets:
        process_file(path)
        if path.name in MANUAL_ROTATIONS:
            rotated += 1
        print(path.name)
    print(f"Processed {len(targets)} images; rotated {rotated}.")


if __name__ == "__main__":
    main()
