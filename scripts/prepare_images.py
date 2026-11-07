"""Собирает веб-изображения из исходных снимков в public/images.

Снимки на кремовом фоне приводятся к белому студийному фону: цвет изделия не меняется,
а фон и падающая тень получают нейтральный оттенок. Широкий кадр манифеста собирается
из этих же снимков умножением, поэтому тени остаются настоящими.
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent / "public" / "images"
PREFIX = "Gemini_Generated_Image_"
WHITE = np.array([246.0, 246.0, 244.0])

BOXES = {
    "tolqyn": (215, 120, 820, 915),
    "uya": (165, 240, 805, 895),
    "qum": (125, 210, 900, 885),
    "tas": (195, 165, 830, 905),
    "kol": (120, 252, 900, 825),
    "saule": (308, 218, 718, 858),
    "japyraq": (163, 268, 800, 960),
}

SOURCES = {
    "products/tolqyn": ("7m9pcx7m9pcx7m9p", True),
    "products/tas": ("6ou8bk6ou8bk6ou8", True),
    "products/qum": ("am0f2dam0f2dam0f", True),
    "products/kol": ("ct2hlqct2hlqct2h", False),
    "products/saule": ("v1tk0hv1tk0hv1tk", False),
    "products/japyraq": ("owm2i9owm2i9owm2", False),
    "products/saiabaq": ("3ysg9q3ysg9q3ysg", False),
    "products/ornek": ("a5d5sca5d5sca5d5", False),
    "products/uya": ("p6dm3vp6dm3vp6dm", False),
    "process/sorting": ("uadlxquadlxquadl", False),
    "process/flakes": ("3ir79x3ir79x3ir7", False),
    "process/printing": ("process/printing.jpg", False),
    "process/tag": ("o32ixoo32ixoo32i", True),
}


def load(name):
    path = ROOT / name if name.endswith(".jpg") else ROOT / f"{PREFIX}{name}.jpg"

    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def background_colour(image):
    height, width, _ = image.shape
    edge = max(height, width) // 16
    patches = [image[:edge, :edge], image[:edge, -edge:], image[:edge, width // 3 : 2 * width // 3], image[-edge:, :edge]]
    pixels = np.concatenate([patch.reshape(-1, 3) for patch in patches])
    light = pixels[pixels.mean(axis=1) >= np.percentile(pixels.mean(axis=1), 55)]

    return np.median(light, axis=0)


def to_white(image):
    colour = background_colour(image)
    total = image.sum(axis=2, keepdims=True) + 1.0
    chroma = image / total
    target = colour / colour.sum()
    distance = np.linalg.norm(chroma - target, axis=2)
    dark = image.mean(axis=2) < 60
    solid = (distance > 0.05) | dark
    solid = ndimage.binary_opening(solid, iterations=2)
    labels, count = ndimage.label(solid)

    if count:
        sizes = ndimage.sum(solid, labels, range(1, count + 1))
        keep = np.isin(labels, 1 + np.flatnonzero(sizes > solid.size * 0.002))
        solid = ndimage.binary_fill_holes(ndimage.binary_closing(keep, iterations=4))

    mask = ndimage.gaussian_filter(solid.astype(np.float64), 1.6)[..., None]
    gain = WHITE / colour
    whitened = np.clip(image * gain, 0, 255)

    return whitened * (1 - mask) + image * mask


def square(image):
    height, width, _ = image.shape
    side = min(height, width)
    top = (height - side) // 2
    left = (width - side) // 2

    return image[top : top + side, left : left + side]


def save(image, path, quality=86):
    target = ROOT / f"{path}.webp"
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(image, 0, 255).astype(np.uint8)).save(target, "WEBP", quality=quality, method=6)


def scaled(image, height):
    source = Image.fromarray(np.clip(image, 0, 255).astype(np.uint8))
    width = round(source.width * height / source.height)

    return np.asarray(source.resize((width, height), Image.LANCZOS), dtype=np.float64)


def cutout(image, box, height, margin=0.1, drop=0.05):
    left, top, right, bottom = box
    scale = height / (bottom - top)
    colour = background_colour(image)
    flat = np.clip(image / colour, 0, 1)
    rows = np.arange(image.shape[0])[:, None]
    columns = np.arange(image.shape[1])[None, :]
    reach = (bottom - top) * margin
    outside_x = np.maximum(np.maximum(left - columns, columns - right), 0)
    outside_y = np.maximum(np.maximum(top - rows, rows - bottom - (bottom - top) * drop), 0)
    fade = np.clip(np.hypot(outside_x, outside_y) / reach, 0, 1)[..., None]
    fade = fade * fade * (3 - 2 * fade)
    layer = flat * (1 - fade) + fade
    size = (round(image.shape[1] * scale), round(image.shape[0] * scale))
    picture = Image.fromarray((layer * 255).astype(np.uint8)).resize(size, Image.LANCZOS)

    return np.asarray(picture, dtype=np.float64) / 255, left * scale, right * scale, bottom * scale


def build_lineup(images):
    width, height, floor = 2400, 860, 750
    canvas = np.ones((height, width, 3))
    layout = [("tolqyn", 470), ("uya", 280), ("qum", 370), ("tas", 250), ("kol", 200), ("saule", 280), ("japyraq", 190)]
    cuts = [cutout(images[name], BOXES[name], size) for name, size in layout]
    objects = sum(right - left for _, left, right, _ in cuts)
    gap = (width - objects) / (len(cuts) + 1)
    cursor = gap

    for layer, left, right, bottom in cuts:
        x = round(cursor - left)
        y = round(floor - bottom)
        rows = slice(max(y, 0), min(y + layer.shape[0], height))
        columns = slice(max(x, 0), min(x + layer.shape[1], width))
        canvas[rows, columns] *= layer[rows.start - y : rows.stop - y, columns.start - x : columns.stop - x]
        cursor += right - left + gap

    return canvas * WHITE


def main():
    images = {}

    for path, (name, cream) in SOURCES.items():
        source = load(name)
        result = to_white(source) if cream else source
        images[path.split("/")[-1]] = result
        save(square(result), path)

    save(build_lineup(images), "manifesto", 84)


if __name__ == "__main__":
    main()
