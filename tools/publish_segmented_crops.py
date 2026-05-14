from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "assets" / "artwork" / "_originals_pxl"
SEGMENTED = ROOT / "assets" / "artwork" / "_review_sam" / "crops"
PUBLISHED = ROOT / "assets" / "artwork"
REPORT = ROOT / "assets" / "artwork" / "_review_sam" / "publish_report.json"


def area_ratio(original: Image.Image, crop: Image.Image) -> float:
    return (crop.width * crop.height) / max(1, original.width * original.height)


def publish_one(source: Path, destination: Path, max_side: int, quality: int) -> None:
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    image.save(destination, quality=quality, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish reviewed SAM crops into the live artwork folder.")
    parser.add_argument("--max-side", type=int, default=1800)
    parser.add_argument("--quality", type=int, default=86)
    parser.add_argument("--min-area-ratio", type=float, default=0.12)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    published = []
    skipped = []
    for crop_path in sorted(SEGMENTED.glob("*.jpg")):
        original_path = ORIGINALS / crop_path.name
        destination = PUBLISHED / crop_path.name
        if not original_path.exists() or not destination.exists():
            skipped.append({"file": crop_path.name, "reason": "missing original or published target"})
            continue
        original = ImageOps.exif_transpose(Image.open(original_path))
        crop = Image.open(crop_path)
        ratio = area_ratio(original, crop)
        if ratio < args.min_area_ratio:
            skipped.append({"file": crop_path.name, "reason": "crop area too small", "areaRatio": round(ratio, 4)})
            continue
        if not args.dry_run:
            publish_one(crop_path, destination, args.max_side, args.quality)
        published.append({"file": crop_path.name, "areaRatio": round(ratio, 4)})

    report = {"published": published, "skipped": skipped}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"published {len(published)}")
    print(f"skipped {len(skipped)}")
    for item in skipped[:80]:
        print("skip", item)


if __name__ == "__main__":
    main()
