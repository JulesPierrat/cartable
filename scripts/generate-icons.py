"""Génère les icônes et l'écran de démarrage provisoires de Cartable (la carte pliée du logo).

Usage : python3 scripts/generate-icons.py   (nécessite Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "images"
WATER = (22, 101, 193, 255)
WHITE = (255, 255, 255, 255)
SUPERSAMPLE = 4

# Le symbole dans sa grille d'origine (34 × 34), comme dans src/platform/ui/Logo.tsx.
OUTLINE = [(8, 10), (14, 8), (20, 10), (26, 8), (26, 24), (20, 26), (14, 24), (8, 26), (8, 10)]
FOLDS = [[(14, 8), (14, 24)], [(20, 10), (20, 26)]]
SYMBOL_BOX = (8, 8, 26, 26)


def draw_symbol(size: int, symbol_width: float, background=None, color=WHITE) -> Image.Image:
    """Dessine la carte pliée centrée, large de `symbol_width` (fraction de `size`)."""
    big = size * SUPERSAMPLE
    image = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    x0, y0, x1, y1 = SYMBOL_BOX
    scale = symbol_width * big / (x1 - x0)
    offset_x = (big - (x1 - x0) * scale) / 2 - x0 * scale
    offset_y = (big - (y1 - y0) * scale) / 2 - y0 * scale

    def project(points):
        return [(offset_x + x * scale, offset_y + y * scale) for x, y in points]

    stroke = round(2 * scale)
    draw.line(project(OUTLINE), fill=color, width=stroke, joint="curve")
    for fold in FOLDS:
        draw.line(project(fold), fill=color, width=stroke)
    for x, y in project(OUTLINE):
        r = stroke / 2
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    draw_symbol(1024, 0.5, background=WATER).save(ASSETS / "icon.png")
    Image.new("RGBA", (512, 512), WATER).save(ASSETS / "android-icon-background.png")
    draw_symbol(512, 0.36).save(ASSETS / "android-icon-foreground.png")
    draw_symbol(432, 0.36).save(ASSETS / "android-icon-monochrome.png")
    draw_symbol(256, 0.8).save(ASSETS / "splash-icon.png")
    draw_symbol(48, 0.6, background=WATER).save(ASSETS / "favicon.png")


if __name__ == "__main__":
    main()
