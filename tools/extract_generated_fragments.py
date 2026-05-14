from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "generated" / "archive-still-life.webp"
OUTPUT = ROOT / "assets" / "generated" / "fragments"


FRAGMENTS = [
    ("drawing-card", (300, 295, 950, 710), 28),
    ("green-torn-paper", (520, 170, 1050, 340), 24),
    ("brass-clip", (225, 565, 345, 735), 24),
    ("red-string-loop", (485, 540, 1220, 805), 30),
    ("small-note", (700, 430, 1280, 730), 22),
    ("black-paper-corner", (1065, 190, 1468, 620), 28),
    ("ceramic-heart", (1330, 520, 1588, 825), 24),
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return sum(abs(a[index] - b[index]) for index in range(3))


def median_color(colors: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    if not colors:
        return (235, 230, 218)
    return tuple(sorted(color[index] for color in colors)[len(colors) // 2] for index in range(3))


def edge_color(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    px = image.load()
    samples: list[tuple[int, int, int]] = []
    step = max(1, min(width, height) // 60)
    for x in range(0, width, step):
        samples.append(px[x, 0])
        samples.append(px[x, height - 1])
    for y in range(0, height, step):
        samples.append(px[0, y])
        samples.append(px[width - 1, y])
    return median_color(samples)


def flood_background(image: Image.Image, threshold: int) -> Image.Image:
    image = image.convert("RGB")
    width, height = image.size
    bg = edge_color(image)
    px = image.load()
    mask = Image.new("L", image.size, 0)
    mask_px = mask.load()
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        if 0 <= x < width and 0 <= y < height and mask_px[x, y] == 0:
            if color_distance(px[x, y], bg) < threshold:
                mask_px[x, y] = 255
                queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            push(nx, ny)
    return mask


def make_fragment(name: str, box: tuple[int, int, int, int], threshold: int) -> None:
    original = Image.open(SOURCE).convert("RGB")
    crop = ImageOps.exif_transpose(original).crop(box)
    background = flood_background(crop, threshold).filter(ImageFilter.GaussianBlur(1.1))
    alpha = ImageChops.invert(background)
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    alpha = alpha.point(lambda p: 0 if p < 36 else min(255, int(p * 1.32)))
    fragment = crop.convert("RGBA")
    fragment.putalpha(alpha)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    fragment.save(OUTPUT / f"{name}.png", optimize=True)


def main() -> None:
    for name, box, threshold in FRAGMENTS:
        make_fragment(name, box, threshold)
        print(f"wrote {OUTPUT / f'{name}.png'}")


if __name__ == "__main__":
    main()
