# Prepares the boss sprite from a photo with a transparent background:
# python tools/assets/boss.py <photo.png> assets-src/sprites/boss.png
# In game the boss is turned 90° clockwise (it shoots down), so the photo must have the top of the head on the left
import sys
from PIL import Image, ImageChops, ImageFilter

SOURCE, OUT = sys.argv[1], sys.argv[2]
LENGTH = 300  # longest side of the sprite, before the glow
GLOW_COLOR = (255, 120, 40)
MARGIN = 14

photo = Image.open(SOURCE).convert('RGBA')
if '--rotate-180' in sys.argv:
    photo = photo.rotate(180)
ratio = LENGTH / max(photo.size)
photo = photo.resize((round(photo.width * ratio), round(photo.height * ratio)), Image.LANCZOS)

canvas = Image.new('RGBA', (photo.width + 2 * MARGIN, photo.height + 2 * MARGIN), (0, 0, 0, 0))
alpha = Image.new('L', canvas.size, 0)
alpha.paste(photo.split()[3], (MARGIN, MARGIN))
halo = alpha.filter(ImageFilter.GaussianBlur(7))
halo = ImageChops.add(halo, halo)
glow = Image.new('RGBA', canvas.size, GLOW_COLOR + (0,))
glow.putalpha(halo)
canvas = Image.alpha_composite(canvas, glow)
sprite = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
sprite.paste(photo, (MARGIN, MARGIN))
Image.alpha_composite(canvas, sprite).save(OUT)
print('boss ok', canvas.size)
