from __future__ import annotations

import argparse
import math
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "artwork" / "_originals_pxl"
PUBLISHED_DIR = ROOT / "assets" / "artwork"
REVIEW_DIR = ROOT / "assets" / "artwork" / "_review_segments"


def fit_size(width: int, height: int, max_side: int) -> tuple[int, int]:
    scale = min(1.0, max_side / max(width, height))
    return max(1, round(width * scale)), max(1, round(height * scale))


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def median_color(colors: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    if not colors:
        return (240, 240, 240)
    channels = []
    for index in range(3):
        values = sorted(color[index] for color in colors)
        channels.append(values[len(values) // 2])
    return tuple(channels)  # type: ignore[return-value]


def edge_samples(image: Image.Image, inset: int = 4) -> list[tuple[int, int, int]]:
    width, height = image.size
    pixels = image.load()
    samples: list[tuple[int, int, int]] = []
    step = max(1, min(width, height) // 140)
    band = max(2, min(width, height) // 35)
    for y in range(0, height, step):
        for x in range(0, min(band, width), step):
            samples.append(pixels[x, y])
        for x in range(max(0, width - band), width, step):
            samples.append(pixels[x, y])
    for x in range(0, width, step):
        for y in range(0, min(band, height), step):
            samples.append(pixels[x, y])
        for y in range(max(0, height - band), height, step):
            samples.append(pixels[x, y])
    if inset:
        return samples[inset:-inset] or samples
    return samples


def split_border_palette(samples: list[tuple[int, int, int]]) -> list[tuple[int, int, int]]:
    """Return a tiny palette for common photo borders: counter, shirt, wall, paper shadow."""
    if not samples:
        return [(240, 240, 240)]
    seeds = [
        median_color(samples),
        min(samples, key=lambda c: sum(c)),
        max(samples, key=lambda c: sum(c)),
    ]
    # A few k-means-ish refinements without pulling in numpy.
    centers = seeds
    for _ in range(5):
        buckets = [[] for _ in centers]
        for color in samples:
            closest = min(range(len(centers)), key=lambda i: color_distance(color, centers[i]))
            buckets[closest].append(color)
        next_centers = []
        for bucket, fallback in zip(buckets, centers):
            next_centers.append(median_color(bucket) if bucket else fallback)
        centers = next_centers
    unique: list[tuple[int, int, int]] = []
    for center in centers:
        if all(color_distance(center, existing) > 22 for existing in unique):
            unique.append(center)
    return unique


def likely_background(
    color: tuple[int, int, int],
    palette: list[tuple[int, int, int]],
    edge_luma: int,
    strictness: int,
) -> bool:
    nearest = min(color_distance(color, center) for center in palette)
    r, g, b = color
    saturation = max(color) - min(color)
    luma = (r * 30 + g * 59 + b * 11) // 100
    # Border-like colors plus low-edge areas become removable background.
    if nearest < strictness and edge_luma < 46:
        return True
    # Cream counters, white walls, black shirts, and skin-toned areas frequently sit at borders.
    if saturation < 42 and (luma > 172 or luma < 68) and edge_luma < 58:
        return True
    if r > g > b and 95 < r < 236 and 62 < g < 205 and 35 < b < 180 and edge_luma < 45:
        return True
    return False


def flood_background(image: Image.Image, strictness: int) -> Image.Image:
    width, height = image.size
    rgb = image.convert("RGB").filter(ImageFilter.MedianFilter(3))
    edges = ImageOps.grayscale(rgb.filter(ImageFilter.FIND_EDGES))
    edge_px = edges.load()
    px = rgb.load()
    palette = split_border_palette(edge_samples(rgb))

    background = Image.new("1", (width, height), 0)
    bg_px = background.load()
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if 0 <= x < width and 0 <= y < height and not bg_px[x, y]:
            if likely_background(px[x, y], palette, edge_px[x, y], strictness):
                bg_px[x, y] = 1
                queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        current = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not bg_px[nx, ny]:
                if color_distance(current, px[nx, ny]) < 48 or likely_background(px[nx, ny], palette, edge_px[nx, ny], strictness):
                    push(nx, ny)
    return background


def clean_mask(mask: Image.Image) -> Image.Image:
    mask_l = mask.convert("L")
    mask_l = mask_l.filter(ImageFilter.MaxFilter(5))
    mask_l = mask_l.filter(ImageFilter.MinFilter(5))
    mask_l = mask_l.filter(ImageFilter.GaussianBlur(1.6))
    return mask_l.point(lambda p: 255 if p > 84 else 0)


def main_component(mask: Image.Image) -> Image.Image:
    width, height = mask.size
    px = mask.load()
    seen = set()
    components: list[tuple[int, tuple[int, int, int, int], list[tuple[int, int]]]] = []
    step = max(1, min(width, height) // 700)

    for start_y in range(0, height, step):
        for start_x in range(0, width, step):
            if px[start_x, start_y] == 0 or (start_x, start_y) in seen:
                continue
            queue = deque([(start_x, start_y)])
            seen.add((start_x, start_y))
            points: list[tuple[int, int]] = []
            min_x = max_x = start_x
            min_y = max_y = start_y
            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x + step, y), (x - step, y), (x, y + step), (x, y - step)):
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in seen and px[nx, ny] > 0:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            components.append((len(points), (min_x, min_y, max_x, max_y), points))

    if not components:
        return mask

    image_area = width * height
    ranked = sorted(
        components,
        key=lambda item: (
            item[0] * step * step,
            -abs(((item[1][0] + item[1][2]) / 2) - width / 2),
            -abs(((item[1][1] + item[1][3]) / 2) - height / 2),
        ),
        reverse=True,
    )
    kept = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(kept)
    for area, box, points in ranked[:4]:
        scaled_area = area * step * step
        box_area = max(1, (box[2] - box[0] + 1) * (box[3] - box[1] + 1))
        if scaled_area < image_area * 0.008:
            continue
        if box_area > image_area * 0.94:
            continue
        for x, y in points:
            draw.rectangle((x, y, min(width - 1, x + step), min(height - 1, y + step)), fill=255)
    return kept if kept.getbbox() else mask


def detect_rotation(crop: Image.Image) -> int:
    width, height = crop.size
    # Rotate obvious sideways sheets/objects only. Leave ambiguous square-ish works alone.
    if width > height * 1.38:
        return 90
    return 0


def segment_one(path: Path, output_dir: Path, max_side: int, strictness: int, padding: float) -> dict[str, object]:
    original = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    small = original.resize(fit_size(*original.size, max_side), Image.Resampling.LANCZOS)

    background = flood_background(small, strictness)
    foreground = ImageChops.invert(background.convert("L")).point(lambda p: 255 if p > 0 else 0)
    mask_small = main_component(clean_mask(foreground))
    bbox = mask_small.getbbox()
    if not bbox:
        bbox = (0, 0, small.width, small.height)

    pad_x = round((bbox[2] - bbox[0]) * padding)
    pad_y = round((bbox[3] - bbox[1]) * padding)
    bbox = (
        max(0, bbox[0] - pad_x),
        max(0, bbox[1] - pad_y),
        min(small.width, bbox[2] + pad_x),
        min(small.height, bbox[3] + pad_y),
    )

    scale_x = original.width / small.width
    scale_y = original.height / small.height
    full_box = (
        max(0, round(bbox[0] * scale_x)),
        max(0, round(bbox[1] * scale_y)),
        min(original.width, round(bbox[2] * scale_x)),
        min(original.height, round(bbox[3] * scale_y)),
    )

    mask_full = mask_small.resize(original.size, Image.Resampling.LANCZOS)
    cutout = original.convert("RGBA")
    cutout.putalpha(mask_full.filter(ImageFilter.GaussianBlur(1.2)))

    crop = original.crop(full_box)
    crop_mask = mask_full.crop(full_box)
    cutout_crop = cutout.crop(full_box)
    rotation = detect_rotation(crop)
    if rotation:
        crop = crop.rotate(rotation, expand=True)
        crop_mask = crop_mask.rotate(rotation, expand=True)
        cutout_crop = cutout_crop.rotate(rotation, expand=True)

    stem = path.stem
    crop_path = output_dir / "crops" / f"{stem}.jpg"
    mask_path = output_dir / "masks" / f"{stem}.png"
    cutout_path = output_dir / "cutouts" / f"{stem}.png"
    crop_path.parent.mkdir(parents=True, exist_ok=True)
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    cutout_path.parent.mkdir(parents=True, exist_ok=True)
    crop.save(crop_path, quality=88, optimize=True)
    crop_mask.save(mask_path)
    cutout_crop.save(cutout_path, optimize=True)

    return {
        "file": path.name,
        "box": full_box,
        "rotation": rotation,
        "crop": str(crop_path.relative_to(ROOT)),
        "mask": str(mask_path.relative_to(ROOT)),
        "cutout": str(cutout_path.relative_to(ROOT)),
    }


def make_sheet(records: list[dict[str, object]], output_dir: Path, columns: int = 3) -> None:
    thumbs: list[Image.Image] = []
    cell_w, cell_h = 720, 420
    for record in records:
        source = ImageOps.exif_transpose(Image.open(SOURCE_DIR / str(record["file"]))).convert("RGB")
        crop = Image.open(ROOT / str(record["crop"])).convert("RGB")
        cutout = Image.open(ROOT / str(record["cutout"])).convert("RGBA")
        panel = Image.new("RGB", (cell_w, cell_h), (246, 244, 238))
        draw = ImageDraw.Draw(panel)
        for index, image in enumerate((source, crop, cutout)):
            image.thumbnail((220, 320), Image.Resampling.LANCZOS)
            x = 18 + index * 234 + (220 - image.width) // 2
            y = 48 + (320 - image.height) // 2
            if image.mode == "RGBA":
                panel.paste((235, 232, 224), (x, y, x + image.width, y + image.height))
                panel.paste(image, (x, y), image)
            else:
                panel.paste(image, (x, y))
        label = f'{record["file"]}  crop {record["box"]}  rotate {record["rotation"]}'
        draw.text((18, 16), label, fill=(35, 35, 35))
        draw.text((18, 384), "original", fill=(80, 80, 80))
        draw.text((252, 384), "crop", fill=(80, 80, 80))
        draw.text((486, 384), "cutout", fill=(80, 80, 80))
        thumbs.append(panel)

    rows = math.ceil(len(thumbs) / columns)
    sheet = Image.new("RGB", (cell_w * columns, cell_h * rows), (230, 226, 218))
    for index, thumb in enumerate(thumbs):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        sheet.paste(thumb, (x, y))
    sheet.save(output_dir / "contact_sheet.jpg", quality=88, optimize=True)


def image_paths(limit: int | None, start: int) -> list[Path]:
    paths = sorted(SOURCE_DIR.glob("*.jpg"))
    if start:
        paths = paths[start:]
    if limit:
        paths = paths[:limit]
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Create artwork crops, masks, and transparent cutouts for review.")
    parser.add_argument("--limit", type=int, default=18)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--max-side", type=int, default=900)
    parser.add_argument("--strictness", type=int, default=58)
    parser.add_argument("--padding", type=float, default=0.025)
    parser.add_argument("--output", type=Path, default=REVIEW_DIR)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    for path in image_paths(args.limit, args.start):
        records.append(segment_one(path, args.output, args.max_side, args.strictness, args.padding))
        print(f'{path.name}: crop={records[-1]["box"]} rotate={records[-1]["rotation"]}')
    make_sheet(records, args.output)
    print(f"review sheet: {args.output / 'contact_sheet.jpg'}")


if __name__ == "__main__":
    main()
