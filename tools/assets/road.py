# Generates the scrolling road: black asphalt, neon blue edges and lane dashes, CRT scanlines
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
OUT = sys.argv[1]
W, H = 540, 240  # shown at scale 2: 1080 px wide, like the game
BLUE = (40, 110, 255)
lines = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(lines)
def neon_line(x, y0, y1, width):
    d.rectangle([x - width, y0, x + width, y1], fill=BLUE + (255,))
    d.rectangle([x - max(1, width // 2), y0, x + max(1, width // 2), y1], fill=(230, 240, 255, 255))
for x in (24, 36, W - 37, W - 25):
    neon_line(x, 0, H, 2)
for x in (150, 270, 390):
    for y in (0, 120):
        neon_line(x, y + 25, y + 95, 3)
glow = lines.split()[3].filter(ImageFilter.GaussianBlur(7))
glow = ImageChops.add(glow, glow)
glow_layer = Image.new('RGBA', (W, H), BLUE + (0,))
glow_layer.putalpha(glow)
bg = Image.new('RGBA', (W, H), (6, 4, 14, 255))
bg = Image.alpha_composite(bg, glow_layer)
bg = Image.alpha_composite(bg, lines)
px = bg.load()
for y in range(0, H, 2):
    for x in range(W):
        r, g, b, a = px[x, y]
        px[x, y] = (int(r * 0.8), int(g * 0.8), int(b * 0.8), a)
bg.convert('RGB').save(f'{OUT}/road.png')
print('road ok')
