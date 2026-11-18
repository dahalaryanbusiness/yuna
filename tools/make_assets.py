"""Generates Yuna's custom animated emojis (assets/emojis) and stickers (assets/stickers).
Run:  python3 tools/make_assets.py     (needs Pillow)
"""
import math, colorsys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets')
EMO = os.path.join(ROOT, 'emojis'); STK = os.path.join(ROOT, 'stickers')
os.makedirs(EMO, exist_ok=True); os.makedirs(STK, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def heart_pts(cx, cy, size, n=160):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * size / 34, cy + y * size / 34))
    return pts

def star_pts(cx, cy, r, inner=0.28, rot=0):
    pts = []
    for i in range(8):
        a = rot + i * math.pi / 4
        rr = r if i % 2 == 0 else r * inner
        pts.append((cx + rr * math.sin(a), cy - rr * math.cos(a)))
    return pts

def rgb(h, s=0.6, v=1.0):
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (int(r * 255), int(g * 255), int(b * 255), 255)

def heart(d, cx, cy, size, fill, outline, shine=True, width=None):
    d.polygon(heart_pts(cx, cy, size), fill=fill, outline=None)
    d.line(heart_pts(cx, cy, size) + [heart_pts(cx, cy, size)[0]], fill=outline, width=width or max(3, int(size / 22)), joint='curve')
    if shine:
        s = size
        d.ellipse((cx - s * .30, cy - s * .32, cx - s * .12, cy - s * .18), fill=(255, 255, 255, 170))

def finish(img, size):
    return img.resize((size, size), Image.LANCZOS)

def gif_frame(img):
    alpha = img.getchannel('A')
    p = img.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p.paste(255, alpha.point(lambda a: 255 if a < 110 else 0))
    return p

def save_gif(frames, path, ms=70):
    fr = [gif_frame(f) for f in frames]
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=2, transparency=255, optimize=False)

def png(img, path): img.save(path)

S = 512; N = 14
def canvas(): 
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

# ---------------------------------------------------------------- emojis (128px)
def e_heart_pulse(i):
    im, d = canvas(); k = 1 + 0.12 * math.sin(2 * math.pi * i / N)
    heart(d, S / 2, S / 2 + 10, 400 * k, (255, 71, 120, 255), (190, 25, 70, 255)); return im
def e_heart_rainbow(i):
    im, d = canvas(); h = i / N
    heart(d, S / 2, S / 2 + 10, 400, rgb(h, .65), rgb(h, .9, .6)); return im
def e_heart_spin(i):
    a = math.cos(2 * math.pi * i / N); w = max(abs(a), 0.08)
    base, d = canvas(); heart(d, S / 2, S / 2 + 10, 400, (255, 90, 150, 255), (200, 40, 100, 255))
    sc = base.resize((int(S * w), S), Image.LANCZOS); im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); im.paste(sc, ((S - sc.width) // 2, 0)); return im
def e_sparkle(i):
    im, d = canvas(); k = 0.55 + 0.45 * abs(math.sin(math.pi * i / N))
    d.polygon(star_pts(S / 2, S / 2, 220 * k, .22), fill=(255, 226, 90, 255), outline=(255, 170, 40, 255))
    d.polygon(star_pts(S / 2, S / 2, 120 * k, .3, math.pi / 4), fill=(255, 255, 255, 235)); return im
def e_stars(i):
    im, d = canvas()
    for j, (x, y, r) in enumerate([(150, 330, 110), (330, 170, 130), (380, 380, 80)]):
        k = 0.5 + 0.5 * abs(math.sin(math.pi * (i / N + j / 3)))
        d.polygon(star_pts(x, y, r * k, .25), fill=(255, 236, 130, 255), outline=(255, 180, 60, 255))
    return im
def e_heart_float(i):
    im, d = canvas(); t = i / N; y = S - 90 - t * 340; a = int(255 * (1 - t ** 2))
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    heart(ld, S / 2 + 40 * math.sin(t * 6), y, 230, (255, 105, 150, 255), (210, 50, 100, 255))
    layer.putalpha(layer.getchannel('A').point(lambda v: int(v * a / 255))); return layer
def e_bubble_hearts(i):
    im, d = canvas()
    for j, (x, col) in enumerate([(130, (255, 120, 170, 255)), (256, (255, 80, 130, 255)), (382, (200, 130, 255, 255))]):
        y = 300 - 70 * abs(math.sin(math.pi * (i / N + j / 3)))
        heart(d, x, y, 170, col, (150, 40, 90, 255), shine=False)
    return im
def e_ring(i):
    im, d = canvas(); d.ellipse((110, 190, 402, 482), outline=(255, 205, 70, 255), width=40)
    d.polygon([(256, 80), (330, 150), (256, 230), (182, 150)], fill=(150, 225, 255, 255), outline=(60, 150, 220, 255))
    k = abs(math.sin(math.pi * i / N)); d.polygon(star_pts(330, 100, 80 * k, .2), fill=(255, 255, 255, 255)); return im
def e_flower(i):
    im, d = canvas(); rot = i * (2 * math.pi / 5) / N
    for p in range(5):
        a = rot + p * 2 * math.pi / 5; x = S / 2 + 120 * math.sin(a); y = S / 2 - 120 * math.cos(a)
        d.ellipse((x - 85, y - 85, x + 85, y + 85), fill=(255, 160, 200, 255), outline=(220, 90, 150, 255), width=8)
    d.ellipse((S / 2 - 70, S / 2 - 70, S / 2 + 70, S / 2 + 70), fill=(255, 220, 90, 255), outline=(230, 170, 40, 255), width=8); return im
def e_crown(i):
    im, d = canvas()
    d.polygon([(70, 400), (50, 160), (170, 270), (256, 110), (342, 270), (462, 160), (442, 400)], fill=(255, 205, 60, 255), outline=(220, 150, 20, 255))
    d.rectangle((70, 400, 442, 440), fill=(255, 180, 40, 255))
    for x, c in [(140, (255, 90, 120, 255)), (256, (110, 190, 255, 255)), (372, (150, 230, 140, 255))]:
        d.ellipse((x - 26, 335, x + 26, 387), fill=c)
    p = (i / N); x = 70 + p * 372; k = 1 - abs(p - .5) * 2
    d.polygon(star_pts(x, 250, 70 * k, .2), fill=(255, 255, 255, 255)); return im
def e_butterfly(i):
    im, d = canvas(); w = 0.35 + 0.65 * abs(math.cos(math.pi * i / N))
    for sgn in (-1, 1):
        for (ox, oy, rx, ry, col) in [(110, -80, 130, 150, (180, 130, 255, 255)), (80, 90, 100, 110, (255, 140, 200, 255))]:
            cx = S / 2 + sgn * ox * w; d.ellipse((cx - rx * w, S / 2 + oy - ry, cx + rx * w, S / 2 + oy + ry), fill=col, outline=(90, 50, 160, 255), width=8)
    d.rounded_rectangle((S / 2 - 16, 150, S / 2 + 16, 380), 16, fill=(70, 40, 100, 255)); return im
def e_moon(i):
    im, d = canvas(); g = 0.5 + 0.5 * math.sin(2 * math.pi * i / N)
    d.ellipse((90, 90, 422, 422), fill=(255, 232, 140, 255)); d.ellipse((170, 60, 470, 360), fill=(0, 0, 0, 0))
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).ellipse((90, 90, 422, 422), fill=255); ImageDraw.Draw(m).ellipse((190, 60, 490, 360), fill=0)
    im = Image.new('RGBA', (S, S), (255, 232, 140, 255)); im.putalpha(m)
    d = ImageDraw.Draw(im); d.polygon(star_pts(380, 150 + 0 * g, 60 * (0.5 + 0.5 * g), .25), fill=(255, 255, 255, 255)) if False else None
    ov = Image.new('RGBA', (S, S), (0, 0, 0, 0)); od = ImageDraw.Draw(ov); od.polygon(star_pts(400, 130, 70 * (0.4 + 0.6 * g), .25), fill=(255, 245, 190, 255), outline=(255, 190, 60, 255))
    return Image.alpha_composite(im, ov)
def e_confetti(i):
    im, d = canvas(); cols = [(255, 100, 140, 255), (120, 200, 255, 255), (255, 220, 80, 255), (160, 230, 150, 255), (200, 140, 255, 255)]
    for j in range(16):
        x = (j * 97) % 460 + 26; y = ((j * 61) % 300 + i * 40 * (1 + j % 3) * .5) % 460 + 26
        d.rounded_rectangle((x, y, x + 36, y + 20), 6, fill=cols[j % 5]); 
    return im
def e_heartbreak(i):
    im, d = canvas(); sh = 8 * math.sin(i * 1.6)
    l = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ld = ImageDraw.Draw(l); heart(ld, S / 2, S / 2 + 10, 400, (120, 120, 160, 255), (70, 70, 110, 255))
    m = Image.new('L', (S, S), 0); md = ImageDraw.Draw(m); md.polygon([(0, 0), (270, 0), (230, 150), (290, 250), (240, 360), (280, S), (0, S)], fill=255)
    left = Image.new('RGBA', (S, S), (0, 0, 0, 0)); left.paste(l, (int(-sh), 0), m)
    right = Image.new('RGBA', (S, S), (0, 0, 0, 0)); inv = m.point(lambda v: 255 - v); right.paste(l, (int(sh), 0), inv)
    return Image.alpha_composite(left, right)

ANIM = {'heart_pulse': e_heart_pulse, 'heart_rainbow': e_heart_rainbow, 'heart_spin': e_heart_spin, 'sparkle': e_sparkle,
        'stars': e_stars, 'heart_float': e_heart_float, 'bubble_hearts': e_bubble_hearts, 'ring': e_ring, 'flower': e_flower,
        'crown': e_crown, 'butterfly': e_butterfly, 'moon': e_moon, 'confetti': e_confetti, 'heartbreak': e_heartbreak}
for name, fn in ANIM.items():
    save_gif([finish(fn(i), 128) for i in range(N)], os.path.join(EMO, f'yuna_{name}.gif'), 70)

for name, (fill, out) in {'heart_pink': ((255, 120, 170, 255), (200, 60, 110, 255)), 'heart_red': ((235, 60, 80, 255), (170, 25, 45, 255)),
        'heart_purple': ((176, 133, 245, 255), (110, 70, 190, 255)), 'heart_blue': ((100, 170, 255, 255), (50, 100, 200, 255)),
        'heart_gold': ((255, 205, 70, 255), (210, 150, 20, 255)), 'heart_black': ((60, 60, 70, 255), (20, 20, 30, 255)),
        'heart_white': ((250, 250, 255, 255), (170, 170, 200, 255)), 'heart_green': ((120, 220, 150, 255), (50, 150, 90, 255))}.items():
    im, d = canvas(); heart(d, S / 2, S / 2 + 10, 400, fill, out); png(finish(im, 128), os.path.join(EMO, f'yuna_{name}.png'))

# ---------------------------------------------------------------- stickers (320px, die-cut look)
SK = 640; F = lambda s: ImageFont.truetype(FONT, s)
def sticker_frame(text, sub, col, accent, i, n=10):
    bob = int(14 * math.sin(2 * math.pi * i / n)); tilt = 5 * math.sin(2 * math.pi * i / n)
    layer = Image.new('RGBA', (SK, SK), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.rounded_rectangle((70, 190 + bob, 570, 470 + bob), 70, fill=col, outline=accent, width=10)
    d.rounded_rectangle((95, 205 + bob, 545, 260 + bob), 28, fill=(255, 255, 255, 70))
    f = F(110 if len(text) <= 7 else 84); w = d.textlength(text, font=f)
    d.text(((SK - w) / 2, 250 + bob), text, font=f, fill=(255, 255, 255, 255), stroke_width=8, stroke_fill=accent)
    f2 = F(44); w2 = d.textlength(sub, font=f2); d.text(((SK - w2) / 2, 400 + bob), sub, font=f2, fill=accent)
    k = 1 + 0.14 * math.sin(2 * math.pi * i / n); heart(d, 520, 175 + bob, 120 * k, accent, (255, 255, 255, 255), shine=False, width=8)
    for j, (x, y) in enumerate([(100, 170), (560, 470), (130, 500)]):
        s = 34 * (0.5 + 0.5 * abs(math.sin(math.pi * (i / n + j / 3)))); d.polygon(star_pts(x, y + bob, s, .3), fill=(255, 245, 160, 255))
    layer = layer.rotate(tilt, resample=Image.BICUBIC, center=(SK / 2, SK / 2))
    a = layer.getchannel('A').filter(ImageFilter.MaxFilter(25)); outline = Image.new('RGBA', (SK, SK), (255, 255, 255, 255)); outline.putalpha(a)
    return Image.alpha_composite(outline, layer)

STICKERS = [('love_you', 'LOVE U', 'forever & always', (255, 105, 150, 255), (190, 40, 100, 255)),
            ('hug', 'HUGS!', 'sending you one', (255, 170, 90, 255), (200, 100, 30, 255)),
            ('kiss', 'MWAH', 'a kiss for you', (255, 120, 140, 255), (190, 50, 80, 255)),
            ('miss_you', 'MISS U', 'come back soon', (160, 140, 255, 255), (90, 70, 190, 255)),
            ('be_mine', 'BE MINE', 'yes or yes?', (255, 100, 120, 255), (180, 30, 60, 255)),
            ('good_morning', 'MORNING', 'rise and shine', (255, 215, 90, 255), (200, 140, 20, 255)),
            ('good_night', 'NIGHTY', 'sweet dreams', (110, 130, 230, 255), (50, 60, 150, 255)),
            ('cutie', 'CUTIE', 'yes, you', (255, 150, 200, 255), (190, 70, 140, 255)),
            ('mine', 'MINE', 'no returns', (190, 120, 255, 255), (120, 50, 190, 255)),
            ('blush', 'BLUSH', 'stop it...', (255, 140, 160, 255), (200, 70, 100, 255)),
            ('yay', 'YAY!', 'celebrate!', (120, 215, 160, 255), (40, 140, 90, 255)),
            ('sorry', 'SORRY', 'forgive me?', (130, 190, 255, 255), (50, 110, 200, 255)),
            ('besties', 'BESTIES', 'ride or die', (255, 130, 210, 255), (180, 50, 150, 255)),
            ('thank_you', 'THANKS', 'you are the best', (140, 220, 200, 255), (40, 150, 130, 255))]
for name, text, sub, col, acc in STICKERS:
    fr = [finish(sticker_frame(text, sub, col, acc, i), 320) for i in range(10)]
    save_gif(fr, os.path.join(STK, f'{name}.gif'), 80)
print('done')
