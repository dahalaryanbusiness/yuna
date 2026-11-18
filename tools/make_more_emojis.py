"""Generates Yuna's extra custom emojis (shop items, UI icons, pets, animated ones) into assets/emojis.
Run:  python3 tools/make_more_emojis.py     (needs Pillow)
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'emojis')
os.makedirs(ROOT, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
S = 512; N = 14
T = (0, 0, 0, 0)

def canvas():
    im = Image.new('RGBA', (S, S), T); return im, ImageDraw.Draw(im)
def finish(img, size=128): return img.resize((size, size), Image.LANCZOS)
def gif_frame(img):
    alpha = img.getchannel('A')
    p = img.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p.paste(255, alpha.point(lambda a: 255 if a < 110 else 0)); return p
def save_gif(frames, path, ms=70):
    fr = [gif_frame(f) for f in frames]
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=2, transparency=255, optimize=False)

def heart_pts(cx, cy, size, n=120):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        pts.append((cx + 16 * math.sin(t) ** 3 * size / 34, cy - (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * size / 34))
    return pts
def star5(cx, cy, r, inner=0.45, rot=0):
    pts = []
    for i in range(10):
        a = rot + i * math.pi / 5; rr = r if i % 2 == 0 else r * inner
        pts.append((cx + rr * math.sin(a), cy - rr * math.cos(a)))
    return pts
def star4(cx, cy, r, inner=0.25):
    pts = []
    for i in range(8):
        a = i * math.pi / 4; rr = r if i % 2 == 0 else r * inner
        pts.append((cx + rr * math.sin(a), cy - rr * math.cos(a)))
    return pts

def ell(d, box, f, o, w=12): d.ellipse(box, fill=f, outline=o, width=w)
def rr(d, box, r, f, o, w=12): d.rounded_rectangle(box, r, fill=f, outline=o, width=w)
def poly(d, pts, f, o, w=12):
    d.polygon(pts, fill=f); d.line(list(pts) + [pts[0]], fill=o, width=w, joint='curve')
def heart(d, cx, cy, size, f, o, w=10): poly(d, heart_pts(cx, cy, size), f, o, w)
def shine(d, x, y, r): d.ellipse((x - r, y - r * .6, x + r, y + r * .6), fill=(255, 255, 255, 170))
def font(s): return ImageFont.truetype(FONT, s)
def text(d, s, cx, cy, size, fill, stroke=0, sf=None):
    f = font(size); w = d.textlength(s, font=f)
    d.text((cx - w / 2, cy - size * .62), s, font=f, fill=fill, stroke_width=stroke, stroke_fill=sf)

# ------------------------------------------------------------------ shop items
def rose():
    im, d = canvas(); d.line([(256, 290), (256, 480)], fill=(60, 160, 80, 255), width=26)
    ell(d, (256, 370, 380, 440), (90, 200, 110, 255), (40, 120, 60, 255), 8); ell(d, (132, 330, 256, 400), (90, 200, 110, 255), (40, 120, 60, 255), 8)
    ell(d, (140, 50, 372, 300), (235, 50, 80, 255), (150, 20, 50, 255)); ell(d, (190, 100, 322, 250), (200, 30, 65, 255), (150, 20, 50, 255), 8)
    d.arc((205, 120, 307, 220), 200, 20, fill=(255, 120, 140, 255), width=10); shine(d, 215, 120, 26); return im
def bouquet():
    im, d = canvas(); poly(d, [(256, 480), (110, 250), (402, 250)], (255, 150, 190, 255), (190, 70, 120, 255))
    for x, y, c in [(160, 190, (255, 100, 140, 255)), (256, 140, (255, 200, 70, 255)), (352, 190, (180, 130, 255, 255))]:
        ell(d, (x - 66, y - 66, x + 66, y + 66), c, (120, 50, 90, 255), 10); ell(d, (x - 22, y - 22, x + 22, y + 22), (255, 245, 170, 255), (210, 150, 40, 255), 6)
    d.line([(256, 250), (256, 330)], fill=(60, 160, 80, 255), width=14); heart(d, 256, 340, 90, (255, 90, 130, 255), (180, 30, 80, 255), 8); return im
def chocolate():
    im, d = canvas(); rr(d, (100, 70, 412, 450), 36, (122, 72, 44, 255), (70, 38, 20, 255))
    for r in range(3):
        for c in range(2):
            rr(d, (130 + c * 140, 100 + r * 112, 252 + c * 140, 192 + r * 112), 14, (160, 100, 62, 255), (90, 50, 28, 255), 6)
    heart(d, 256, 280, 70, (255, 120, 160, 255), (190, 50, 100, 255), 6); return im
def cake():
    im, d = canvas(); rr(d, (80, 270, 432, 450), 30, (255, 170, 200, 255), (190, 80, 130, 255))
    ell(d, (70, 220, 442, 330), (255, 250, 250, 255), (210, 150, 180, 255), 10)
    for x in (150, 256, 362): d.ellipse((x - 26, 300, x + 26, 360), fill=(255, 250, 250, 255))
    ell(d, (226, 140, 286, 230), (255, 235, 150, 255), (200, 150, 60, 255), 8); d.polygon([(256, 60), (232, 120), (280, 120)], fill=(255, 150, 50, 255))
    ell(d, (150, 205, 200, 255), (230, 40, 80, 255), (150, 10, 40, 255), 6) if False else None
    ell(d, (150, 175, 206, 231), (230, 40, 80, 255), (150, 10, 40, 255), 6); return im
def teddy():
    im, d = canvas(); b = (190, 130, 80, 255); o = (110, 70, 40, 255)
    ell(d, (70, 70, 200, 200), b, o); ell(d, (312, 70, 442, 200), b, o); ell(d, (105, 105, 165, 165), (240, 190, 150, 255), o, 6); ell(d, (347, 105, 407, 165), (240, 190, 150, 255), o, 6)
    ell(d, (90, 110, 422, 440), b, o); ell(d, (170, 280, 342, 410), (240, 200, 160, 255), o, 8)
    ell(d, (170, 220, 210, 270), (40, 25, 20, 255), (40, 25, 20, 255), 2); ell(d, (302, 220, 342, 270), (40, 25, 20, 255), (40, 25, 20, 255), 2)
    ell(d, (226, 290, 286, 330), (60, 35, 30, 255), (60, 35, 30, 255), 2); d.arc((216, 310, 296, 370), 20, 160, fill=(60, 35, 30, 255), width=8)
    heart(d, 256, 440, 80, (255, 90, 130, 255), (180, 30, 80, 255), 8); return im
def balloon():
    im, d = canvas(); d.line([(256, 380), (230, 440), (280, 480)], fill=(120, 120, 140, 255), width=8)
    poly(d, [(256, 360), (232, 395), (280, 395)], (225, 50, 90, 255), (150, 20, 60, 255), 8)
    ell(d, (120, 50, 392, 380), (255, 80, 130, 255), (180, 30, 80, 255)); shine(d, 200, 130, 40); heart(d, 256, 220, 100, (255, 200, 220, 255), (255, 255, 255, 255), 4); return im
def letter():
    im, d = canvas(); rr(d, (50, 120, 462, 400), 30, (255, 240, 245, 255), (200, 120, 160, 255))
    d.line([(60, 140), (256, 290), (452, 140)], fill=(200, 120, 160, 255), width=12); heart(d, 256, 290, 100, (240, 50, 90, 255), (160, 20, 60, 255), 8); return im
def candle():
    im, d = canvas(); rr(d, (206, 230, 306, 450), 18, (255, 245, 220, 255), (200, 170, 120, 255)); ell(d, (150, 430, 362, 480), (255, 200, 90, 255), (200, 140, 30, 255), 8)
    d.polygon([(256, 50), (214, 150), (230, 205), (282, 205), (298, 150)], fill=(255, 150, 40, 255)); d.polygon([(256, 105), (236, 170), (246, 200), (266, 200), (276, 170)], fill=(255, 235, 120, 255)); return im
def arrow():
    im, d = canvas(); d.line([(80, 430), (400, 110)], fill=(140, 90, 50, 255), width=24)
    poly(d, [(450, 60), (340, 90), (420, 170)], (255, 90, 130, 255), (180, 30, 80, 255), 10)
    for k in (0, 40):
        d.polygon([(80 + k, 430 - k), (50 + k, 400 - k), (110 + k, 400 - k)], fill=(255, 200, 220, 255))
    heart(d, 250, 270, 110, (255, 100, 150, 255), (180, 30, 80, 255), 8); return im
def necklace():
    im, d = canvas()
    for i in range(15):
        a = math.pi * (0.1 + 0.8 * i / 14); x = 256 + 190 * math.cos(a); y = 90 + 250 * math.sin(a) * .8
        ell(d, (x - 20, y - 20, x + 20, y + 20), (255, 250, 245, 255), (200, 180, 200, 255), 6)
    heart(d, 256, 380, 150, (255, 80, 130, 255), (180, 20, 70, 255)); shine(d, 215, 335, 26); return im
def lock():
    im, d = canvas(); d.arc((160, 60, 352, 340), 180, 360, fill=(170, 175, 190, 255), width=44); d.line([(168, 200), (168, 250)], fill=(170, 175, 190, 255), width=44); d.line([(344, 200), (344, 250)], fill=(170, 175, 190, 255), width=44)
    rr(d, (100, 230, 412, 460), 40, (255, 200, 60, 255), (200, 140, 20, 255)); heart(d, 256, 340, 90, (200, 40, 80, 255), (130, 20, 50, 255), 6); return im
def perfume():
    im, d = canvas(); rr(d, (206, 50, 306, 130), 16, (255, 200, 70, 255), (200, 140, 20, 255)); rr(d, (226, 125, 286, 200), 8, (200, 200, 220, 255), (130, 130, 160, 255), 8)
    rr(d, (140, 195, 372, 460), 50, (255, 170, 215, 255), (200, 90, 150, 255)); heart(d, 256, 330, 100, (255, 245, 250, 255), (210, 120, 170, 255), 6); shine(d, 190, 250, 22); return im
def lipstick():
    im, d = canvas(); rr(d, (170, 270, 342, 470), 20, (60, 60, 75, 255), (30, 30, 40, 255)); rr(d, (160, 220, 352, 290), 12, (255, 200, 70, 255), (200, 140, 20, 255), 8)
    poly(d, [(190, 225), (190, 110), (230, 60), (322, 130), (322, 225)], (235, 40, 90, 255), (150, 15, 60, 255), 8); return im
def wine():
    im, d = canvas(); poly(d, [(140, 60), (372, 60), (350, 230), (256, 310), (162, 230)], (240, 235, 250, 255), (160, 150, 190, 255))
    poly(d, [(150, 140), (362, 140), (350, 230), (256, 310), (162, 230)], (190, 30, 70, 255), (130, 15, 45, 255), 6); d.rectangle((240, 300, 272, 420), fill=(200, 205, 220, 255)); ell(d, (160, 410, 352, 470), (200, 205, 220, 255), (140, 140, 170, 255), 8); return im
def ticket():
    im, d = canvas(); rr(d, (40, 150, 472, 362), 26, (255, 200, 70, 255), (200, 140, 20, 255))
    d.ellipse((10, 232, 70, 282), fill=T); d.ellipse((442, 232, 502, 282), fill=T)
    for y in range(170, 350, 26): d.line([(150, y), (150, y + 12)], fill=(200, 140, 20, 255), width=6)
    d.polygon(star5(330, 256, 70), fill=(255, 250, 220, 255)); heart(d, 90, 256, 70, (200, 40, 80, 255), (130, 20, 50, 255), 4) if False else None; return im
def gem_shape(top, mid, bot, line):
    im, d = canvas(); pts = [(150, 110), (362, 110), (450, 220), (256, 450), (62, 220)]
    poly(d, pts, mid, line); poly(d, [(150, 110), (362, 110), (330, 220), (182, 220)], top, line, 6)
    poly(d, [(62, 220), (182, 220), (256, 450)], bot, line, 6); poly(d, [(450, 220), (330, 220), (256, 450)], bot, line, 6); shine(d, 200, 150, 30); return im
def gem(): return gem_shape((255, 120, 150, 255), (230, 40, 90, 255), (190, 25, 70, 255), (130, 10, 45, 255))
def diamond(): return gem_shape((200, 245, 255, 255), (130, 215, 250, 255), (90, 170, 235, 255), (40, 110, 190, 255))
def trophy():
    im, d = canvas(); d.arc((50, 90, 200, 270), 90, 270, fill=(220, 160, 30, 255), width=24); d.arc((312, 90, 462, 270), 270, 90, fill=(220, 160, 30, 255), width=24)
    poly(d, [(120, 60), (392, 60), (360, 240), (256, 320), (152, 240)], (255, 205, 60, 255), (200, 140, 20, 255)); d.rectangle((232, 310, 280, 390), fill=(230, 170, 40, 255))
    rr(d, (150, 385, 362, 460), 16, (120, 75, 45, 255), (70, 40, 20, 255), 8); d.polygon(star5(256, 170, 60), fill=(255, 250, 200, 255)); return im
def fish():
    im, d = canvas(); poly(d, [(370, 256), (470, 160), (470, 352)], (255, 150, 90, 255), (200, 90, 40, 255))
    ell(d, (50, 150, 400, 362), (110, 190, 255, 255), (50, 110, 200, 255)); poly(d, [(200, 160), (260, 80), (300, 160)], (255, 150, 90, 255), (200, 90, 40, 255), 8)
    ell(d, (110, 220, 150, 260), (255, 255, 255, 255), (40, 40, 60, 255), 8); d.arc((230, 190, 330, 320), 280, 80, fill=(50, 110, 200, 255), width=8); return im
def key():
    im, d = canvas(); ell(d, (50, 150, 230, 330), (255, 205, 70, 255), (200, 140, 20, 255), 14); ell(d, (105, 205, 175, 275), T, (200, 140, 20, 255), 12)
    rr(d, (210, 225, 460, 265), 12, (255, 205, 70, 255), (200, 140, 20, 255), 8); rr(d, (380, 255, 420, 340), 8, (255, 205, 70, 255), (200, 140, 20, 255), 8); rr(d, (430, 255, 465, 320), 8, (255, 205, 70, 255), (200, 140, 20, 255), 8); return im
def chest():
    im, d = canvas(); rr(d, (60, 230, 452, 450), 20, (150, 95, 55, 255), (80, 45, 20, 255)); d.pieslice((60, 100, 452, 360), 180, 360, fill=(175, 115, 65, 255), outline=(80, 45, 20, 255), width=12)
    d.rectangle((60, 225, 452, 255), fill=(255, 205, 70, 255)); d.rectangle((226, 130, 286, 450), fill=(255, 205, 70, 255)); rr(d, (216, 260, 296, 340), 14, (255, 235, 130, 255), (200, 140, 20, 255), 8); d.ellipse((246, 285, 266, 315), fill=(80, 45, 20, 255)); return im
def coin():
    im, d = canvas(); ell(d, (50, 50, 462, 462), (255, 205, 70, 255), (200, 140, 20, 255), 18); ell(d, (100, 100, 412, 412), (255, 225, 110, 255), (225, 165, 40, 255), 10)
    heart(d, 256, 262, 170, (255, 90, 130, 255), (180, 30, 80, 255), 8); return im
def moneybag():
    im, d = canvas(); poly(d, [(190, 70), (322, 70), (290, 170), (222, 170)], (190, 150, 90, 255), (110, 80, 40, 255), 10)
    ell(d, (80, 150, 432, 470), (200, 165, 100, 255), (110, 80, 40, 255)); rr(d, (200, 150, 312, 185), 10, (255, 90, 130, 255), (180, 30, 80, 255), 6)
    heart(d, 256, 320, 130, (255, 90, 130, 255), (180, 30, 80, 255), 8); return im
def gift():
    im, d = canvas(); rr(d, (90, 230, 422, 460), 14, (255, 120, 170, 255), (190, 50, 110, 255)); rr(d, (60, 170, 452, 250), 14, (255, 150, 195, 255), (190, 50, 110, 255))
    d.rectangle((226, 170, 286, 460), fill=(255, 215, 90, 255)); ell(d, (130, 70, 256, 180), (255, 215, 90, 255), (200, 140, 20, 255), 10); ell(d, (256, 70, 382, 180), (255, 215, 90, 255), (200, 140, 20, 255), 10); ell(d, (226, 140, 286, 200), (255, 190, 60, 255), (200, 140, 20, 255), 8); return im
def pearl():
    im, d = canvas(); d.pieslice((60, 230, 452, 470), 0, 180, fill=(255, 175, 205, 255), outline=(190, 90, 130, 255), width=10)
    ell(d, (150, 90, 362, 300), (255, 250, 255, 255), (200, 190, 225, 255), 10); shine(d, 215, 150, 30); return im
def bone():
    im, d = canvas(); rr(d, (110, 220, 402, 292), 16, (255, 245, 225, 255), (200, 170, 120, 255), 10)
    for x, y in [(100, 200), (100, 290), (412, 200), (412, 290)]: ell(d, (x - 50, y - 50, x + 50, y + 50), (255, 245, 225, 255), (200, 170, 120, 255), 10)
    rr(d, (110, 218, 402, 294), 8, (255, 245, 225, 255), (255, 245, 225, 255), 2); return im
def check():
    im, d = canvas(); ell(d, (40, 40, 472, 472), (80, 210, 120, 255), (30, 130, 70, 255), 16); d.line([(140, 270), (224, 355), (380, 170)], fill=(255, 255, 255, 255), width=50, joint='curve'); return im
def cross():
    im, d = canvas(); ell(d, (40, 40, 472, 472), (240, 80, 90, 255), (160, 30, 40, 255), 16); d.line([(165, 165), (347, 347)], fill=(255, 255, 255, 255), width=48); d.line([(347, 165), (165, 347)], fill=(255, 255, 255, 255), width=48); return im
def info():
    im, d = canvas(); ell(d, (40, 40, 472, 472), (90, 160, 255, 255), (40, 90, 190, 255), 16); text(d, 'i', 256, 270, 320, (255, 255, 255, 255)); return im
def warn():
    im, d = canvas(); poly(d, [(256, 50), (480, 450), (32, 450)], (255, 205, 60, 255), (200, 130, 10, 255), 16); text(d, '!', 256, 330, 270, (80, 50, 10, 255)); return im
def clock():
    im, d = canvas(); ell(d, (40, 40, 472, 472), (255, 250, 250, 255), (200, 110, 150, 255), 18); d.line([(256, 256), (256, 130)], fill=(70, 50, 90, 255), width=24); d.line([(256, 256), (350, 300)], fill=(255, 90, 130, 255), width=20); ell(d, (236, 236, 276, 276), (70, 50, 90, 255), (70, 50, 90, 255), 2); return im
def dice(pips=5, ang=0):
    im, d = canvas(); rr(d, (60, 60, 452, 452), 70, (255, 250, 250, 255), (200, 110, 150, 255), 16)
    P = {1: [(256, 256)], 2: [(160, 160), (352, 352)], 3: [(160, 160), (256, 256), (352, 352)], 4: [(160, 160), (352, 160), (160, 352), (352, 352)],
         5: [(160, 160), (352, 160), (256, 256), (160, 352), (352, 352)], 6: [(160, 150), (352, 150), (160, 256), (352, 256), (160, 362), (352, 362)]}[pips]
    for x, y in P: ell(d, (x - 30, y - 30, x + 30, y + 30), (240, 60, 100, 255), (240, 60, 100, 255), 2)
    return im.rotate(ang, resample=Image.BICUBIC) if ang else im
def cards():
    im, d = canvas(); a = Image.new('RGBA', (S, S), T); ad = ImageDraw.Draw(a); rr(ad, (130, 80, 360, 440), 30, (255, 250, 250, 255), (120, 120, 150, 255), 12); text(ad, '♠', 245, 270, 190, (50, 50, 70, 255))
    b = Image.new('RGBA', (S, S), T); bd = ImageDraw.Draw(b); rr(bd, (150, 80, 380, 440), 30, (255, 250, 250, 255), (200, 100, 140, 255), 12); heart(bd, 265, 265, 140, (240, 60, 100, 255), (160, 20, 60, 255), 6)
    return Image.alpha_composite(a.rotate(14, resample=Image.BICUBIC, center=(256, 450)), b.rotate(-12, resample=Image.BICUBIC, center=(256, 450)))
def slot(spin=0):
    im, d = canvas(); rr(d, (60, 60, 410, 470), 50, (230, 60, 100, 255), (150, 20, 60, 255), 14); rr(d, (95, 110, 375, 300), 24, (255, 250, 250, 255), (150, 20, 60, 255), 8)
    syms = [(240, 60, 100, 255), (255, 205, 70, 255), (90, 160, 255, 255), (80, 210, 120, 255)]
    for k in range(3):
        c = syms[(k + spin) % 4]; x = 165 + k * 90
        if (k + spin) % 2: heart(d, x, 205, 66, c, (120, 20, 50, 255), 4)
        else: d.polygon(star5(x, 205, 42), fill=c, outline=(120, 70, 20, 255))
    d.line([(440, 120), (440, 220)], fill=(180, 180, 200, 255), width=16); ell(d, (418, 80, 462, 124), (255, 90, 130, 255), (150, 20, 60, 255), 6)
    rr(d, (120, 340, 350, 420), 16, (110, 20, 50, 255), (110, 20, 50, 255), 2); return im
def bank():
    im, d = canvas(); poly(d, [(256, 50), (470, 180), (42, 180)], (255, 205, 70, 255), (200, 140, 20, 255))
    for x in (100, 200, 300, 400): rr(d, (x - 24, 200, x + 24, 390), 8, (255, 245, 225, 255), (200, 170, 120, 255), 8)
    rr(d, (50, 395, 462, 450), 10, (255, 205, 70, 255), (200, 140, 20, 255), 10); heart(d, 256, 140, 60, (255, 90, 130, 255), (180, 30, 80, 255), 4); return im
def paw():
    im, d = canvas(); c = (255, 160, 190, 255); o = (190, 80, 120, 255)
    ell(d, (150, 250, 362, 440), c, o); 
    for x, y, w in [(70, 230, 80), (170, 120, 90), (290, 120, 90), (385, 230, 80)]: ell(d, (x, y, x + w + 20, y + w + 40), c, o, 10)
    return im
def kissmark():
    im, d = canvas(); poly(d, [(60, 270), (150, 160), (256, 200), (362, 160), (452, 270), (256, 410)], (235, 50, 95, 255), (150, 15, 55, 255), 12)
    d.line([(80, 270), (256, 285), (432, 270)], fill=(150, 15, 55, 255), width=10); shine(d, 190, 220, 24); return im
def shield():
    im, d = canvas(); poly(d, [(256, 40), (450, 110), (430, 300), (256, 470), (82, 300), (62, 110)], (100, 170, 255, 255), (40, 90, 190, 255), 16); heart(d, 256, 250, 190, (255, 255, 255, 255), (255, 200, 220, 255), 6); return im
def star_gold():
    im, d = canvas(); poly(d, star5(256, 270, 230, .5), (255, 215, 80, 255), (210, 150, 20, 255), 14); shine(d, 215, 190, 30); return im
def fire(i=0):
    im, d = canvas(); w = 14 * math.sin(i * 2 * math.pi / N)
    d.polygon([(256 + w, 40), (150, 230), (90, 340), (150, 450), (256, 480), (362, 450), (422, 340), (360, 230), (300 - w, 150)], fill=(255, 110, 40, 255))
    d.polygon([(256 - w, 170), (180, 320), (210, 440), (256, 470), (302, 440), (332, 320)], fill=(255, 190, 60, 255)); d.polygon([(256, 300), (220, 400), (256, 450), (292, 400)], fill=(255, 245, 170, 255)); return im

# pets
def pet(kind):
    im, d = canvas()
    cfg = {'cat': ((255, 175, 90, 255), (190, 100, 30, 255)), 'dog': ((200, 150, 100, 255), (120, 80, 40, 255)), 'bunny': ((255, 245, 250, 255), (200, 150, 190, 255)),
           'fox': ((255, 140, 60, 255), (170, 70, 20, 255)), 'panda': ((255, 255, 255, 255), (60, 60, 70, 255)), 'dragon': ((120, 215, 140, 255), (40, 130, 80, 255))}
    f, o = cfg[kind]; dark = (50, 40, 50, 255)
    if kind == 'cat': poly(d, [(80, 220), (90, 50), (210, 130)], f, o, 10); poly(d, [(432, 220), (422, 50), (302, 130)], f, o, 10)
    if kind == 'dog': ell(d, (40, 110, 170, 340), (150, 100, 60, 255), o, 10); ell(d, (342, 110, 472, 340), (150, 100, 60, 255), o, 10)
    if kind == 'bunny': ell(d, (130, 10, 230, 250), f, o, 10); ell(d, (282, 10, 382, 250), f, o, 10); ell(d, (160, 50, 200, 200), (255, 170, 200, 255), (255, 170, 200, 255), 2); ell(d, (312, 50, 352, 200), (255, 170, 200, 255), (255, 170, 200, 255), 2)
    if kind == 'fox': poly(d, [(80, 230), (80, 40), (220, 140)], f, o, 10); poly(d, [(432, 230), (432, 40), (292, 140)], f, o, 10)
    if kind == 'panda': ell(d, (60, 70, 190, 200), dark, dark, 2); ell(d, (322, 70, 452, 200), dark, dark, 2)
    if kind == 'dragon': poly(d, [(150, 140), (120, 20), (210, 110)], (255, 235, 150, 255), (200, 160, 50, 255), 8); poly(d, [(362, 140), (392, 20), (302, 110)], (255, 235, 150, 255), (200, 160, 50, 255), 8)
    ell(d, (70, 100, 442, 470), f, o, 14)
    if kind == 'fox': poly(d, [(70, 330), (256, 470), (170, 300)], (255, 250, 245, 255), o, 6); poly(d, [(442, 330), (256, 470), (342, 300)], (255, 250, 245, 255), o, 6)
    if kind == 'panda':
        ell(d, (130, 230, 215, 340), dark, dark, 2); ell(d, (297, 230, 382, 340), dark, dark, 2)
    ec = (255, 255, 255, 255) if kind == 'panda' else dark
    ell(d, (160, 250, 205, 310), dark, dark, 2) if kind != 'panda' else None
    ell(d, (307, 250, 352, 310), dark, dark, 2) if kind != 'panda' else None
    if kind == 'panda': ell(d, (160, 265, 190, 305), (255, 255, 255, 255), (255, 255, 255, 255), 2); ell(d, (322, 265, 352, 305), (255, 255, 255, 255), (255, 255, 255, 255), 2)
    ell(d, (226, 330, 286, 372), (255, 130, 160, 255) if kind not in ('panda',) else dark, dark, 4)
    d.arc((196, 350, 256, 410), 10, 170, fill=dark, width=8); d.arc((256, 350, 316, 410), 10, 170, fill=dark, width=8)
    ell(d, (120, 340, 170, 380), (255, 150, 170, 150), (255, 150, 170, 150), 2); ell(d, (342, 340, 392, 380), (255, 150, 170, 150), (255, 150, 170, 150), 2)
    if kind == 'cat':
        for s in (-1, 1): d.line([(256 + s * 120, 355), (256 + s * 230, 335)], fill=dark, width=6); d.line([(256 + s * 120, 375), (256 + s * 230, 385)], fill=dark, width=6)
    return im

STATIC = dict(rose=rose, bouquet=bouquet, chocolate=chocolate, cake=cake, teddy=teddy, balloon=balloon, letter=letter, candle=candle, arrow=arrow,
    necklace=necklace, lock=lock, perfume=perfume, lipstick=lipstick, wine=wine, ticket=ticket, gem=gem, diamond=diamond, trophy=trophy, fish=fish,
    key=key, chest=chest, coin=coin, moneybag=moneybag, gift=gift, pearl=pearl, bone=bone, check=check, cross=cross, info=info, warn=warn, clock=clock,
    dice=dice, cards=cards, slot=slot, bank=bank, paw=paw, kissmark=kissmark, shield=shield, star_gold=star_gold)
for k in ('cat', 'dog', 'bunny', 'fox', 'panda', 'dragon'): STATIC['pet_' + k] = (lambda k=k: pet(k))

for name, fn in STATIC.items():
    finish(fn()).save(os.path.join(ROOT, f'yuna_{name}.png'))

# ---------------------------------------------------------------- animated
def spin(fn):
    base = fn(); out = []
    for i in range(N):
        w = max(abs(math.cos(2 * math.pi * i / N)), 0.08); sc = base.resize((int(S * w), S), Image.LANCZOS)
        im = Image.new('RGBA', (S, S), T); im.paste(sc, ((S - sc.width) // 2, 0)); out.append(im)
    return out
def bounce(fn):
    base = fn(); out = []
    for i in range(N):
        im = Image.new('RGBA', (S, S), T); im.paste(base, (0, int(-50 * abs(math.sin(math.pi * i / N)))), base); out.append(im)
    return out
def glint(fn):
    base = fn(); out = []
    for i in range(N):
        im = base.copy(); d = ImageDraw.Draw(im); t = i / N; k = 1 - abs(t - .5) * 2
        d.polygon(star4(120 + t * 280, 130 + t * 160, 90 * k, .2), fill=(255, 255, 255, 255)); out.append(im)
    return out
ANIM = {'coin_spin': spin(coin), 'gem_shine': glint(gem), 'diamond_shine': glint(diamond), 'gift_bounce': bounce(gift), 'trophy_shine': glint(trophy),
        'fire': [fire(i) for i in range(N)], 'slot_spin': [slot(i // 2) for i in range(N)], 'dice_roll': [dice(1 + (i // 2) % 6, i * 25) for i in range(N)],
        'crown_shine': glint(lambda: Image.open(os.path.join(ROOT, 'yuna_crown.gif')).convert('RGBA').resize((S, S))) if False else glint(star_gold)}
for name, frames in ANIM.items():
    save_gif([finish(f) for f in frames], os.path.join(ROOT, f'yuna_{name}.gif'), 70)
print(len(STATIC) + len(ANIM), 'emojis written')
