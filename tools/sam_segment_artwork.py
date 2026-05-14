from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageOps

from segment_artwork import ROOT, SOURCE_DIR, fit_size, flood_background, clean_mask, main_component, make_sheet


MODEL_DIR = ROOT / ".models" / "sam"
ENCODER_PATH = MODEL_DIR / "sam_vit_b-encoder-int8.onnx"
DECODER_PATH = MODEL_DIR / "sam_vit_b-decoder-int8.onnx"
OUTPUT_DIR = ROOT / "assets" / "artwork" / "_review_sam"
SAM_SIZE = 1024
MEAN = np.array([123.675, 116.28, 103.53], dtype=np.float32)
STD = np.array([58.395, 57.12, 57.375], dtype=np.float32)


def heuristic_box(image: Image.Image, max_side: int = 900) -> tuple[int, int, int, int]:
    small = image.resize(fit_size(*image.size, max_side), Image.Resampling.LANCZOS)
    background = flood_background(small, strictness=58)
    foreground = ImageOps.invert(background.convert("L")).point(lambda p: 255 if p > 0 else 0)
    mask = main_component(clean_mask(foreground))
    bbox = mask.getbbox()
    if not bbox:
        return (0, 0, image.width, image.height)

    sx = image.width / small.width
    sy = image.height / small.height
    pad_x = round((bbox[2] - bbox[0]) * 0.04 * sx)
    pad_y = round((bbox[3] - bbox[1]) * 0.04 * sy)
    return (
        max(0, round(bbox[0] * sx) - pad_x),
        max(0, round(bbox[1] * sy) - pad_y),
        min(image.width, round(bbox[2] * sx) + pad_x),
        min(image.height, round(bbox[3] * sy) + pad_y),
    )


def preprocess(image: Image.Image) -> tuple[np.ndarray, float]:
    width, height = image.size
    scale = SAM_SIZE / max(width, height)
    new_w = round(width * scale)
    new_h = round(height * scale)
    resized = image.resize((new_w, new_h), Image.Resampling.BICUBIC)
    canvas = Image.new("RGB", (SAM_SIZE, SAM_SIZE), (0, 0, 0))
    canvas.paste(resized, (0, 0))
    array = np.asarray(canvas).astype(np.float32)
    array = (array - MEAN) / STD
    array = np.transpose(array, (2, 0, 1))[None, :, :, :]
    return array, scale


def point_prompt(box: tuple[int, int, int, int], image_size: tuple[int, int], scale: float) -> tuple[np.ndarray, np.ndarray]:
    x0, y0, x1, y1 = box
    width, height = image_size
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    # Positive points ask SAM for the object/sheet. Negative border points suppress
    # countertop, body, wall, and other photo context that often surrounds the work.
    points = np.array(
        [[
            [cx, cy],
            [(x0 * 2 + x1) / 3, cy],
            [(x0 + x1 * 2) / 3, cy],
            [width * 0.04, height * 0.04],
            [width * 0.96, height * 0.04],
            [width * 0.04, height * 0.96],
            [width * 0.96, height * 0.96],
            [width * 0.50, height * 0.98],
            [width * 0.50, height * 0.02],
        ]],
        dtype=np.float32,
    )
    points *= scale
    labels = np.array([[1, 1, 1, 0, 0, 0, 0, 0, 0]], dtype=np.float32)
    return points, labels


def run_sam(
    image: Image.Image,
    encoder: ort.InferenceSession,
    decoder: ort.InferenceSession,
    box: tuple[int, int, int, int],
) -> tuple[Image.Image, float]:
    encoder_input, scale = preprocess(image)
    embeddings = encoder.run(None, {"input_image": encoder_input})[0]
    point_coords, point_labels = point_prompt(box, image.size, scale)
    decoder_inputs = {
        "image_embeddings": embeddings,
        "point_coords": point_coords,
        "point_labels": point_labels,
        "mask_input": np.zeros((1, 1, 256, 256), dtype=np.float32),
        "has_mask_input": np.zeros((1,), dtype=np.float32),
        "orig_im_size": np.array([image.height, image.width], dtype=np.float32),
    }
    masks, scores, _ = decoder.run(None, decoder_inputs)
    mask = masks[0, 0]
    mask = (mask > 0).astype(np.uint8) * 255
    pil_mask = Image.fromarray(mask, mode="L")
    pil_mask = pil_mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
    pil_mask = pil_mask.point(lambda p: 255 if p > 88 else 0)
    return pil_mask, float(scores[0, 0])


def crop_from_mask(mask: Image.Image, image_size: tuple[int, int], padding: float) -> tuple[int, int, int, int]:
    bbox = mask.getbbox()
    if not bbox:
        return (0, 0, image_size[0], image_size[1])
    x0, y0, x1, y1 = bbox
    pad_x = round((x1 - x0) * padding)
    pad_y = round((y1 - y0) * padding)
    return (
        max(0, x0 - pad_x),
        max(0, y0 - pad_y),
        min(image_size[0], x1 + pad_x),
        min(image_size[1], y1 + pad_y),
    )


def detect_rotation(box: tuple[int, int, int, int]) -> int:
    width = box[2] - box[0]
    height = box[3] - box[1]
    if width > height * 1.55:
        return 90
    return 0


def segment_one(
    path: Path,
    encoder: ort.InferenceSession,
    decoder: ort.InferenceSession,
    output_dir: Path,
    padding: float,
) -> dict[str, object]:
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    prompt_box = heuristic_box(image)
    mask = None
    score = -1.0
    try:
        mask, score = run_sam(image, encoder, decoder, prompt_box)
    except Exception as exc:
        print(f"{path.name}: SAM failed, using heuristic mask: {exc}")
    if mask is None or not mask.getbbox():
        small = image.resize(fit_size(*image.size, 900), Image.Resampling.LANCZOS)
        background = flood_background(small, strictness=58)
        foreground = ImageOps.invert(background.convert("L")).point(lambda p: 255 if p > 0 else 0)
        mask = main_component(clean_mask(foreground)).resize(image.size, Image.Resampling.LANCZOS)

    crop_box = crop_from_mask(mask, image.size, padding)
    crop = image.crop(crop_box)
    crop_mask = mask.crop(crop_box)
    cutout = image.convert("RGBA")
    cutout.putalpha(mask.filter(ImageFilter.GaussianBlur(0.8)))
    cutout_crop = cutout.crop(crop_box)

    rotation = detect_rotation(crop_box)
    if rotation:
        crop = crop.rotate(rotation, expand=True)
        crop_mask = crop_mask.rotate(rotation, expand=True)
        cutout_crop = cutout_crop.rotate(rotation, expand=True)

    stem = path.stem
    crop_path = output_dir / "crops" / f"{stem}.jpg"
    mask_path = output_dir / "masks" / f"{stem}.png"
    cutout_path = output_dir / "cutouts" / f"{stem}.png"
    overlay_path = output_dir / "overlays" / f"{stem}.jpg"
    for folder in (crop_path.parent, mask_path.parent, cutout_path.parent, overlay_path.parent):
        folder.mkdir(parents=True, exist_ok=True)

    crop.save(crop_path, quality=90, optimize=True)
    crop_mask.save(mask_path, optimize=True)
    cutout_crop.save(cutout_path, optimize=True)

    overlay = image.convert("RGBA")
    tint = Image.new("RGBA", image.size, (232, 44, 66, 88))
    overlay.alpha_composite(Image.composite(tint, Image.new("RGBA", image.size, (0, 0, 0, 0)), mask))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle(crop_box, outline=(25, 180, 110, 255), width=max(6, image.width // 300))
    overlay.convert("RGB").save(overlay_path, quality=86, optimize=True)

    return {
        "file": path.name,
        "box": crop_box,
        "prompt_box": prompt_box,
        "rotation": rotation,
        "score": round(score, 4),
        "crop": str(crop_path.relative_to(ROOT)),
        "mask": str(mask_path.relative_to(ROOT)),
        "cutout": str(cutout_path.relative_to(ROOT)),
        "overlay": str(overlay_path.relative_to(ROOT)),
    }


def image_paths(limit: int | None, start: int) -> list[Path]:
    paths = sorted(SOURCE_DIR.glob("*.jpg"))
    if start:
        paths = paths[start:]
    if limit:
        paths = paths[:limit]
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Use SAM ONNX to create reviewable artwork crops, masks, and cutouts.")
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--padding", type=float, default=0.025)
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR)
    args = parser.parse_args()

    if not ENCODER_PATH.exists() or not DECODER_PATH.exists():
        raise SystemExit(f"Missing SAM ONNX models in {MODEL_DIR}")

    args.output.mkdir(parents=True, exist_ok=True)
    encoder = ort.InferenceSession(str(ENCODER_PATH), providers=["CPUExecutionProvider"])
    decoder = ort.InferenceSession(str(DECODER_PATH), providers=["CPUExecutionProvider"])
    records = []
    for path in image_paths(args.limit, args.start):
        record = segment_one(path, encoder, decoder, args.output, args.padding)
        records.append(record)
        print(f'{path.name}: score={record["score"]} crop={record["box"]} rotate={record["rotation"]}')
    make_sheet(records, args.output)
    print(f"review sheet: {args.output / 'contact_sheet.jpg'}")


if __name__ == "__main__":
    main()
