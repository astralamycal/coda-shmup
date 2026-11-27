# Generates original neon/CRT pixel-art sprites (facing right, like the rest of the atlas)
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

OUT = sys.argv[1]
PX = 4  # size of one "pixel" of the pixel art

def grid_to_image(rows, palette):
    h, w = len(rows), len(rows[0])
    im = Image.new('RGBA', (w * PX, h * PX), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != '.':
                d.rectangle([x * PX, y * PX, x * PX + PX - 1, y * PX + PX - 1], fill=palette[c])
    return im

def crt(im):
    # Thin dark columns: once rotated in game (cars face up or down), they read as horizontal CRT scanlines
    px = im.load()
    w, h = im.size
    for x in range(0, w, 2):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r * 0.72), int(g * 0.72), int(b * 0.72), a)
    return im

def glow(im, color, radius=6, margin=10, strength=2):
    w, h = im.size
    canvas = Image.new('RGBA', (w + 2 * margin, h + 2 * margin), (0, 0, 0, 0))
    alpha = Image.new('L', canvas.size, 0)
    alpha.paste(im.split()[3], (margin, margin))
    halo = alpha.filter(ImageFilter.GaussianBlur(radius))
    for _ in range(strength - 1):
        halo = ImageChops.add(halo, halo.filter(ImageFilter.GaussianBlur(radius)))
    layer = Image.new('RGBA', canvas.size, color + (0,))
    layer.putalpha(halo.point(lambda v: min(255, int(v * 0.9))))
    canvas = Image.alpha_composite(canvas, layer)
    sprite = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    sprite.paste(im, (margin, margin))
    return Image.alpha_composite(canvas, sprite)

# Top-down cars, nose on the right. B body, W window, T tire, H headlight, R tail light, S stripe/spoiler
COMPACT = [
    "...TTTT.........TTTT....",
    "..BBBBBBBBBBBBBBBBBBBB..",
    ".RBBBBBBBBBBBBBBBBBBBBH.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".BBBBWWWBBBBBBWWWWBBBBB.",
    ".RBBBBBBBBBBBBBBBBBBBBH.",
    "..BBBBBBBBBBBBBBBBBBBB..",
    "...TTTT.........TTTT....",
]
COUPE = [
    "....TTTTT..........TTTTT....",
    "..BBBBBBBBBBBBBBBBBBBBBBBB..",
    ".RBBBBBBBBBBBBBBBBBBBBBBBBH.",
    ".BBBBBWWWBBBBBBBBBWWWWBBBBBB",
    ".BBSSSWWWBBBBBBBBBWWWWBBSSSB",
    ".BBBBBWWWBBBBBBBBBWWWWBBBBBB",
    ".BBBBBWWWBBBBBBBBBWWWWBBBBBB",
    ".BBSSSWWWBBBBBBBBBWWWWBBSSSB",
    ".BBBBBWWWBBBBBBBBBWWWWBBBBBB",
    ".RBBBBBBBBBBBBBBBBBBBBBBBBH.",
    "..BBBBBBBBBBBBBBBBBBBBBBBB..",
    "....TTTTT..........TTTTT....",
]
RACER = [
    "SS...TTTTT...........TTTTT.....",
    "SS.BBBBBBBBBBBBBBBBBBBBBBBBBB..",
    "SSRBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
    "SS.BBBBBBWWWBBBBBBBBWWWWBBBBBBB",
    "SSSSSSSSSWWWSSSSSSSSWWWWSSSSSSH",
    "SS.BBBBBBWWWBBBBBBBBWWWWBBBBBBB",
    "SS.BBBBBBWWWBBBBBBBBWWWWBBBBBBB",
    "SSSSSSSSSWWWSSSSSSSSWWWWSSSSSSH",
    "SS.BBBBBBWWWBBBBBBBBWWWWBBBBBBB",
    "SSRBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
    "SS.BBBBBBBBBBBBBBBBBBBBBBBBBB..",
    "SS...TTTTT...........TTTTT.....",
]
ENEMY = [
    "...TTTTT...........TTTTT....",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBB.",
    "RBBBBBBBBBBBBBBBBBBBBBBBBBBH",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "BBBBBWWWWBBBBBBBBBWWWWWBBBBB",
    "RBBBBBBBBBBBBBBBBBBBBBBBBBBH",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBB.",
    "...TTTTT...........TTTTT....",
]

CYAN = (57, 214, 255)
PLAYER_PALETTE = {'B': (235, 250, 255, 255), 'W': (16, 40, 90, 255), 'T': (40, 40, 50, 255),
                  'H': (255, 245, 170, 255), 'R': (255, 60, 90, 255), 'S': (57, 214, 255, 255)}
# Enemies are white and grey: the tint from enemies.json gives each type its color
ENEMY_PALETTE = {'B': (255, 255, 255, 255), 'W': (70, 70, 80, 255), 'T': (45, 45, 50, 255),
                 'H': (255, 255, 255, 255), 'R': (200, 200, 200, 255), 'S': (255, 255, 255, 255)}

def car(rows, palette, glow_color):
    return glow(crt(grid_to_image(rows, palette)), glow_color)

car(COMPACT, PLAYER_PALETTE, CYAN).save(f'{OUT}/playerCar1.png')
car(COUPE, PLAYER_PALETTE, CYAN).save(f'{OUT}/playerCar2.png')
car(RACER, PLAYER_PALETTE, CYAN).save(f'{OUT}/playerCar3.png')
# Same margin on the 3 enemy frames: the animation must not change the sprite size
ENEMY_MARGIN = 16
glow(crt(grid_to_image(ENEMY, ENEMY_PALETTE)), (255, 255, 255), margin=ENEMY_MARGIN).save(f'{OUT}/enemyCar.png')

# Shooting animation of the enemies: the headlights flash
def flash(rows, size):
    im = grid_to_image(rows, ENEMY_PALETTE)
    d = ImageDraw.Draw(im)
    w, h = im.size
    for y in [2 * PX + PX // 2, (len(rows) - 3) * PX + PX // 2]:
        d.ellipse([w - PX - size, y - size, w - PX + size, y + size], fill=(255, 255, 255, 255))
    return glow(crt(im), (255, 255, 255), radius=6 + size // 2, margin=ENEMY_MARGIN)

flash(ENEMY, 4).save(f'{OUT}/enemyCar-shoot0.png')
flash(ENEMY, 8).save(f'{OUT}/enemyCar-shoot1.png')

# Life icon for the HUD: the compact car, nose up
icon = grid_to_image(COMPACT, PLAYER_PALETTE).rotate(90, expand=True)
icon = icon.resize((icon.width // 2, icon.height // 2), Image.NEAREST)
glow(icon, CYAN, radius=3, margin=5).save(f'{OUT}/playerLife.png')

# XP orb: a small yellow diamond
orb = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
ImageDraw.Draw(orb).polygon([(12, 0), (24, 12), (12, 24), (0, 12)], fill=(255, 230, 110, 255))
ImageDraw.Draw(orb).polygon([(12, 6), (18, 12), (12, 18), (6, 12)], fill=(255, 255, 230, 255))
glow(orb, (255, 200, 60), radius=5, margin=10).save(f'{OUT}/orb.png')

# Health pickup: a pink cross, the color of the health bar
cross = Image.new('RGBA', (30, 30), (0, 0, 0, 0))
d = ImageDraw.Draw(cross)
d.rectangle([10, 0, 19, 29], fill=(255, 90, 180, 255))
d.rectangle([0, 10, 29, 19], fill=(255, 90, 180, 255))
d.rectangle([13, 4, 16, 25], fill=(255, 230, 245, 255))
d.rectangle([4, 13, 25, 16], fill=(255, 230, 245, 255))
glow(cross, (255, 63, 164), radius=5, margin=12).save(f'{OUT}/healthPickup.png')

# Particle for explosions
spark = Image.new('RGBA', (6, 6), (255, 255, 255, 255))
glow(spark, (255, 255, 255), radius=3, margin=5, strength=1).save(f'{OUT}/spark.png')
print('sprites ok')
