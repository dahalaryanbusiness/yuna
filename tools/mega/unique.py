"""Yuna's signature emojis for her own features: Garden, Sky, Vault, Whisper, Aura, Mood, Ritual, Duet, Trust."""
from .base import *

OL = (60, 40, 70, 255)

def _flower(petal, center, kind):
    im, d = canvas()
    line(d, [(256, 300), (256, 480)], (70, 170, 90, 255), 22)
    poly(d, [(256, 430), (360, 380), (330, 440)], (90, 200, 110, 255), (50, 140, 70, 255), 8)
    poly(d, [(256, 400), (150, 350), (180, 410)], (90, 200, 110, 255), (50, 140, 70, 255), 8)
    p, po = A(petal), dark(petal, .7)
    if kind == 'tulip':
        poly(d, [(170, 120), (200, 250), (256, 290), (312, 250), (342, 120), (300, 170), (256, 90), (212, 170)], p, po, 10)
        poly(d, [(256, 90), (300, 170), (256, 290), (212, 170)], lite(petal, .3), po, 8)
    elif kind == 'lily':
        for a in range(0, 360, 60):
            r = math.radians(a); cx, cy = 256 + 95 * math.sin(r), 200 - 95 * math.cos(r)
            poly(d, [(256, 200), (cx - 38 * math.cos(r), cy - 38 * math.sin(r)), (256 + 160 * math.sin(r), 200 - 160 * math.cos(r)), (cx + 38 * math.cos(r), cy + 38 * math.sin(r))], p, po, 8)
        circ(d, 256, 200, 26, A(center))
    elif kind == 'sunflower':
        for a in range(0, 360, 24):
            r = math.radians(a); ell(d, (256 + 120 * math.sin(r) - 34, 200 - 120 * math.cos(r) - 34, 256 + 120 * math.sin(r) + 34, 200 - 120 * math.cos(r) + 34), p, po, 6)
        circ(d, 256, 200, 82, A(center), dark(center, .6), 8)
        for i in range(14):
            r = math.radians(i * 137.5); k = 8 + i * 4.6; circ(d, 256 + k * math.sin(r), 200 - k * math.cos(r), 5, dark(center, .7))
    elif kind == 'orchid':
        for sx in (-1, 1): ell(d, (256 + sx * 100 - 70, 90, 256 + sx * 100 + 70, 230), p, po, 8)
        ell(d, (186, 60, 326, 210), lite(petal, .25), po, 8)
        poly(d, [(206, 215), (306, 215), (256, 320)], A(center), dark(center, .6), 8)
        for i in (-1, 1): circ(d, 256 + i * 40, 190, 9, WHITE)
    else:  # daisy
        for a in range(0, 360, 30):
            r = math.radians(a); ell(d, (256 + 105 * math.sin(r) - 26, 200 - 105 * math.cos(r) - 52, 256 + 105 * math.sin(r) + 26, 200 - 105 * math.cos(r) + 4), p, po, 5)
        circ(d, 256, 200, 54, A(center), dark(center, .6), 8)
    return im

def _bud(color):
    im, d = canvas(); line(d, [(256, 280), (256, 480)], (70, 170, 90, 255), 22)
    poly(d, [(256, 440), (350, 400), (320, 455)], (90, 200, 110, 255), (50, 140, 70, 255), 8)
    ell(d, (196, 120, 316, 300), A(color), dark(color, .7), 10); poly(d, [(206, 190), (256, 110), (306, 190), (256, 280)], lite(color, .35), None)
    poly(d, [(216, 270), (256, 330), (296, 270)], (90, 200, 110, 255), (50, 140, 70, 255), 8); return im

def _sprout():
    im, d = canvas(); poly(d, [(120, 400), (392, 400), (360, 480), (152, 480)], (150, 100, 65, 255), (95, 60, 35, 255), 10)
    line(d, [(256, 400), (256, 250)], (70, 170, 90, 255), 20)
    poly(d, [(256, 270), (140, 240), (170, 160), (256, 230)], (110, 215, 120, 255), (50, 140, 70, 255), 8)
    poly(d, [(256, 230), (370, 190), (390, 110), (256, 190)], (110, 215, 120, 255), (50, 140, 70, 255), 8); return im

def _seed():
    im, d = canvas(); ell(d, (170, 120, 342, 400), (190, 130, 80, 255), (110, 70, 40, 255), 12); ell(d, (205, 160, 270, 260), (225, 175, 120, 255)); line(d, [(256, 140), (256, 380)], (120, 80, 45, 255), 8); return im

def _wilted():
    im, d = canvas(); line(d, [(256, 480), (256, 330), (330, 250)], (150, 130, 80, 255), 20)
    poly(d, [(330, 250), (400, 300), (360, 360), (300, 300)], (170, 150, 120, 255), (110, 95, 70, 255), 8)
    poly(d, [(256, 430), (160, 400), (190, 460)], (150, 140, 90, 255), (100, 90, 60, 255), 8); return im

def _can():
    im, d = canvas(); rr(d, (130, 170, 360, 420), 40, (110, 190, 255, 255), (50, 110, 190, 255), 12)
    poly(d, [(350, 260), (470, 150), (500, 190), (365, 340)], (110, 190, 255, 255), (50, 110, 190, 255), 10); rr(d, (110, 110, 360, 150), 18, (70, 150, 230, 255), (50, 110, 190, 255), 8)
    shine(d, 190, 240, 36)
    for x, y in [(470, 230), (500, 290), (455, 300)]: poly(d, [(x, y - 26), (x + 16, y + 8), (x - 16, y + 8)], (110, 200, 255, 255)); circ(d, x, y + 10, 16, (110, 200, 255, 255))
    return im

def _drop():
    im, d = canvas(); poly(d, [(256, 40), (390, 280), (256, 330), (122, 280)], (110, 190, 255, 255)); circ(d, 256, 320, 130, (110, 190, 255, 255), (50, 110, 190, 255), 12)
    poly(d, [(256, 40), (380, 270), (132, 270)], (110, 190, 255, 255)); shine(d, 205, 330, 36); return im

def _sun():
    im, d = canvas()
    for a in range(0, 360, 30): r = math.radians(a); line(d, [(256 + 150 * math.sin(r), 256 - 150 * math.cos(r)), (256 + 215 * math.sin(r), 256 - 215 * math.cos(r))], (255, 190, 50, 255), 22)
    circ(d, 256, 256, 125, (255, 215, 70, 255), (230, 150, 20, 255), 12); shine(d, 215, 205, 48); return im

def _pot(color=(235, 130, 90)):
    im, d = canvas(); poly(d, [(110, 220), (402, 220), (360, 470), (152, 470)], A(color), dark(color, .6), 12); rr(d, (90, 170, 422, 250), 24, lite(color, .15), dark(color, .6), 12)
    line(d, [(256, 170), (256, 80)], (70, 170, 90, 255), 18); poly(d, [(256, 120), (170, 80), (200, 40), (256, 90)], (110, 215, 120, 255), (50, 140, 70, 255), 6); return im

def _shears():
    im, d = canvas(); line(d, [(150, 110), (350, 390)], (190, 195, 210, 255), 30); line(d, [(350, 110), (150, 390)], (170, 175, 195, 255), 30)
    circ(d, 130, 430, 52, T, (230, 80, 120, 255), 22); circ(d, 382, 430, 52, T, (230, 80, 120, 255), 22); circ(d, 256, 250, 14, (110, 115, 135, 255)); return im

def _bag():
    im, d = canvas(); poly(d, [(150, 140), (362, 140), (420, 460), (92, 460)], (225, 180, 120, 255), (140, 95, 50, 255), 12); rr(d, (130, 100, 382, 170), 20, (190, 140, 85, 255), (140, 95, 50, 255), 10)
    line(d, [(210, 100), (256, 60), (302, 100)], (140, 95, 50, 255), 12); circ(d, 256, 320, 76, (255, 245, 225, 255), (140, 95, 50, 255), 8); heart(d, 256, 320, 80, (255, 100, 150, 255)); return im

def _bouquet():
    im, d = canvas(); poly(d, [(256, 480), (130, 260), (382, 260)], (255, 245, 235, 255), (190, 150, 140, 255), 10); poly(d, [(256, 480), (180, 310), (332, 310)], (255, 160, 190, 255))
    for x, y, c in [(170, 190, (255, 110, 160)), (256, 140, (255, 215, 80)), (340, 190, (190, 130, 240)), (212, 250, (255, 140, 100)), (300, 250, (110, 200, 255))]:
        for a in range(0, 360, 72): r = math.radians(a); circ(d, x + 38 * math.sin(r), y - 38 * math.cos(r), 30, A(c), dark(c, .65), 5)
        circ(d, x, y, 22, (255, 240, 150, 255), dark(c, .65), 5)
    return im

def _star(c, big=False, outline=None):
    im, d = canvas(); poly(d, star(256, 266, 230 if big else 190, .46), A(c), outline or dark(c, .6), 14); poly(d, star(256, 266, 120 if big else 100, .46), lite(c, .45)); shine(d, 200, 190, 30); return im

def _comet():
    out = []
    for i in range(FRAMES):
        im, d = canvas(); t = i / FRAMES; ox = 10 * math.sin(2 * math.pi * t)
        for k in range(7): a = 200 - k * 26; circ(d, 300 - k * 28 + ox, 220 + k * 24 - 0, 40 - k * 4, (255, 215, 120, max(a, 25)))
        circ(d, 360 + ox, 160, 70, (255, 235, 150, 255), (255, 170, 50, 255), 10); circ(d, 345 + ox, 140, 24, WHITE)
        d.polygon(sparkle4(110, 100, 40 + 20 * math.sin(2 * math.pi * t), .22), fill=(255, 255, 255, 230)); out.append(im)
    return out

def _moon(phase):
    from PIL import ImageChops
    im, d = canvas(); R = 200; box = (256 - R, 256 - R, 256 + R, 256 + R)
    circ(d, 256, 256, R, (60, 60, 105, 255), (30, 30, 70, 255), 12)
    lit = Image.new('L', (S, S), 0); ld = ImageDraw.Draw(lit)
    if phase == 4: ld.ellipse(box, fill=255)
    elif phase != 0:
        waxing = phase < 4
        ld.pieslice(box, 270 if waxing else 90, 450 if waxing else 270, fill=255)
        w = int(R * (.55 if phase in (1, 7) else .55))
        ell_box = (256 - w, 256 - R, 256 + w, 256 + R)
        if phase in (1, 7): ld.ellipse(ell_box, fill=0)       # crescent: carve the terminator out
        elif phase in (3, 5): ld.ellipse(ell_box, fill=255)    # gibbous: add the terminator back (quarters stay a clean half)
    disc = Image.new('L', (S, S), 0); ImageDraw.Draw(disc).ellipse(box, fill=255)
    lit = ImageChops.multiply(lit, disc)
    glow = Image.new('RGBA', (S, S), (255, 240, 180, 255)); glow.putalpha(lit); im.alpha_composite(glow)
    d2 = ImageDraw.Draw(im); d2.ellipse(box, outline=(30, 30, 70, 255), width=12)
    return im

def _constellation():
    im, d = canvas(); rr(d, (30, 30, 482, 482), 90, (35, 35, 85, 255), (20, 20, 55, 255), 12)
    pts = [(120, 340), (200, 200), (300, 270), (380, 140), (410, 330)]; line(d, pts, (190, 200, 255, 200), 8)
    for x, y in pts: poly(d, sparkle4(x, y, 36, .3), (255, 235, 150, 255)); circ(d, x, y, 9, WHITE)
    return im

def _wish():
    out = []
    for i in range(FRAMES):
        im, d = canvas(); t = i / FRAMES; s = 1 + .12 * math.sin(2 * math.pi * t)
        poly(d, star(256, 266, 190 * s, .46), (255, 215, 80, 255), (230, 150, 20, 255), 14); poly(d, star(256, 266, 100 * s, .46), (255, 240, 170, 255))
        for k in range(4): a = 2 * math.pi * (t + k / 4); d.polygon(sparkle4(256 + 215 * math.sin(a), 256 - 215 * math.cos(a), 30, .25), fill=(255, 255, 255, 235))
        out.append(im)
    return out

def _telescope():
    im, d = canvas(); poly(d, [(60, 250), (330, 120), (370, 200), (100, 330)], (120, 140, 210, 255), (60, 80, 150, 255), 12); poly(d, [(320, 110), (440, 60), (480, 140), (360, 195)], (170, 190, 240, 255), (60, 80, 150, 255), 12)
    line(d, [(230, 270), (170, 470)], (110, 90, 70, 255), 20); line(d, [(230, 270), (320, 470)], (110, 90, 70, 255), 20); line(d, [(230, 270), (250, 470)], (110, 90, 70, 255), 20); return im

def _galaxy():
    im, d = canvas(); circ(d, 256, 256, 215, (30, 25, 80, 255), (15, 10, 50, 255), 10)
    for k in range(3):
        for t in range(40):
            a = t * .25 + k * 2.1; r = 12 + t * 4.4; circ(d, 256 + r * math.cos(a), 256 + r * math.sin(a) * .8, 9 + t * .15, (190 + k * 20, 140 + t * 2, 255, max(60, 255 - t * 4)))
    circ(d, 256, 256, 34, (255, 240, 200, 255)); return im

def _vault():
    im, d = canvas(); rr(d, (50, 70, 462, 440), 40, (150, 158, 178, 255), (80, 88, 112, 255), 14); rr(d, (85, 105, 427, 405), 28, (190, 198, 218, 255), (110, 118, 142, 255), 10)
    circ(d, 256, 255, 100, (120, 128, 152, 255), (70, 78, 100, 255), 12); circ(d, 256, 255, 52, (255, 200, 60, 255), (200, 140, 20, 255), 10)
    for a in range(0, 360, 60): r = math.radians(a); line(d, [(256 + 52 * math.sin(r), 255 - 52 * math.cos(r)), (256 + 100 * math.sin(r), 255 - 100 * math.cos(r))], (255, 200, 60, 255), 12)
    for x in (110, 402): rr(d, (x - 14, 440, x + 14, 480), 6, (80, 88, 112, 255)); return im
    return im

def _lock(open_=False):
    im, d = canvas()
    if open_: d.arc((150, 20, 362, 260), 180, 360, fill=(150, 158, 178, 255), width=36); line(d, [(150, 140), (150, 215)], (150, 158, 178, 255), 36)
    else: d.arc((150, 40, 362, 280), 180, 360, fill=(150, 158, 178, 255), width=36); line(d, [(150, 160), (150, 230)], (150, 158, 178, 255), 36); line(d, [(362, 160), (362, 230)], (150, 158, 178, 255), 36)
    rr(d, (100, 215, 412, 460), 50, (255, 195, 70, 255), (200, 130, 20, 255), 14); circ(d, 256, 320, 36, (110, 70, 20, 255)); rr(d, (242, 330, 270, 400), 10, (110, 70, 20, 255)); shine(d, 170, 262, 28); return im

def _key():
    im, d = canvas(); circ(d, 160, 160, 100, T, (255, 195, 70, 255), 42); line(d, [(230, 230), (440, 440)], (255, 195, 70, 255), 38); line(d, [(360, 360), (410, 310)], (255, 195, 70, 255), 32); line(d, [(405, 405), (450, 360)], (255, 195, 70, 255), 32); heart(d, 160, 165, 60, (255, 110, 150, 255)); return im

def _scroll():
    im, d = canvas(); rr(d, (110, 90, 402, 420), 14, (255, 240, 205, 255), (180, 140, 80, 255), 12); ell(d, (80, 60, 180, 130), (240, 205, 150, 255), (180, 140, 80, 255), 10); ell(d, (332, 380, 432, 450), (240, 205, 150, 255), (180, 140, 80, 255), 10)
    for y in (170, 220, 270, 320): line(d, [(160, y), (352, y)], (190, 160, 110, 255), 10)
    return im

def _seal():
    im, d = canvas(); poly(d, [(256 + (200 if i % 2 == 0 else 170) * math.sin(i * math.pi / 12), 256 - (200 if i % 2 == 0 else 170) * math.cos(i * math.pi / 12)) for i in range(24)], (225, 55, 90, 255), (150, 20, 55, 255), 12)
    circ(d, 256, 256, 120, T, (255, 150, 175, 255), 10); heart(d, 256, 262, 130, (255, 175, 195, 255)); return im

def _mask():
    im, d = canvas(); poly(d, [(70, 150), (256, 110), (442, 150), (420, 330), (256, 460), (92, 330)], (250, 250, 255, 255), (110, 100, 150, 255), 14)
    for x in (175, 337): poly(d, [(x - 60, 220), (x, 190), (x + 60, 220), (x, 260)], (110, 100, 150, 255))
    d.arc((170, 300, 342, 400), 20, 160, fill=(110, 100, 150, 255), width=12); heart(d, 256, 160, 54, (255, 100, 150, 255)); return im

def _envelope():
    im, d = canvas(); rr(d, (50, 110, 462, 420), 36, (255, 245, 250, 255), (190, 110, 150, 255), 14); line(d, [(60, 130), (256, 290), (452, 130)], (190, 110, 150, 255), 14); heart(d, 256, 330, 90, (255, 100, 150, 255)); return im

def _qmark():
    im, d = canvas(); circ(d, 256, 256, 215, (150, 110, 230, 255), (90, 60, 170, 255), 14); text(d, '?', 256, 252, 330, WHITE, 0); return im

def _eye():
    im, d = canvas(); poly(d, [(30, 256), (150, 140), (256, 115), (362, 140), (482, 256), (362, 372), (256, 397), (150, 372)], WHITE, (110, 100, 150, 255), 14); circ(d, 256, 256, 90, (150, 110, 230, 255), (90, 60, 170, 255), 10); circ(d, 256, 256, 42, INK); circ(d, 230, 230, 16, WHITE); return im

def _feather():
    im, d = canvas(); poly(d, [(430, 50), (330, 80), (180, 200), (110, 340), (150, 390), (280, 330), (400, 190)], (200, 175, 255, 255), (120, 90, 190, 255), 12); line(d, [(430, 50), (80, 470)], (120, 90, 190, 255), 12)
    for k in range(5): line(d, [(380 - k * 55, 100 + k * 60), (310 - k * 55, 150 + k * 62)], (150, 120, 220, 255), 8)
    return im

def _quill():
    im, d = canvas(); poly(d, [(450, 40), (330, 70), (210, 200), (160, 330), (210, 340), (330, 260), (430, 130)], (255, 200, 225, 255), (200, 100, 150, 255), 12); poly(d, [(160, 330), (80, 470), (150, 400), (210, 340)], (60, 50, 90, 255)); return im

def _orb(c, kind):
    def draw(t=0.):
        im, d = canvas(); r = 190 + 10 * math.sin(2 * math.pi * t)
        for k in range(6): circ(d, 256, 256, r + 30 - k * 5, (c[0], c[1], c[2], 18))
        circ(d, 256, 256, r - 30, A(c), dark(c, .6), 14); circ(d, 256, 256, r - 85, lite(c, .35)); circ(d, 256, 256, r - 135, lite(c, .65)); shine(d, 200, 180, 48)
        if kind == 'ember': poly(d, [(256, 150), (310, 270), (256, 360), (202, 270)], (255, 235, 150, 255))
        if kind == 'tide': d.arc((150, 230, 362, 330), 200, 340, fill=WHITE, width=14); d.arc((150, 270, 362, 370), 200, 340, fill=WHITE, width=14)
        if kind == 'bloom': [circ(d, 256 + 60 * math.sin(math.radians(a)), 256 - 60 * math.cos(math.radians(a)), 30, (255, 255, 255, 230)) for a in range(0, 360, 72)]
        if kind == 'gale': [d.arc((140 + k * 20, 200 + k * 30, 380 - k * 20, 300 + k * 30), 190, 350, fill=WHITE, width=12) for k in range(3)]
        if kind == 'dusk': circ(d, 256, 256, 70, (255, 235, 200, 255)); circ(d, 280, 242, 62, A(c))
        if kind == 'dawn': d.pieslice((156, 230, 356, 430), 180, 360, fill=(255, 235, 150, 255))
        if kind == 'frost': [line(d, [(256 + 90 * math.sin(math.radians(a)), 256 - 90 * math.cos(math.radians(a))), (256 - 90 * math.sin(math.radians(a)), 256 + 90 * math.cos(math.radians(a)))], WHITE, 10) for a in (0, 60, 120)]
        if kind == 'star': poly(d, star(256, 262, 90, .45), (255, 245, 190, 255))
        return im
    return [draw(i / FRAMES) for i in range(FRAMES)]

def _weather(kind):
    im, d = canvas()
    if kind == 'sunny': return _sun()
    cloud = lambda col, ox=0, oy=0: [circ(d, 170 + ox, 290 + oy, 80, col), circ(d, 270 + ox, 230 + oy, 100, col), circ(d, 360 + ox, 295 + oy, 75, col), rr(d, (170 + ox, 290 + oy, 360 + ox, 372 + oy), 40, col)]
    if kind == 'cloudy': circ(d, 330, 150, 80, (255, 215, 70, 255)); cloud((235, 240, 252, 255), 0, 40); shine(d, 250, 215, 40, 150)
    if kind == 'stormy':
        cloud((120, 125, 160, 255), 0, -40); poly(d, [(280, 300), (210, 400), (260, 400), (230, 490), (340, 360), (285, 360), (320, 300)], (255, 220, 60, 255), (210, 140, 10, 255), 8)
    if kind == 'rainbow':
        for i, c in enumerate([(235, 60, 80), (255, 150, 50), (255, 224, 70), (70, 200, 110), (60, 110, 240), (150, 90, 220)]): d.arc((40 + i * 22, 90 + i * 22, 472 - i * 22, 560 - i * 22), 180, 360, fill=A(c), width=26)
        circ(d, 90, 400, 50, WHITE); circ(d, 150, 400, 60, WHITE); circ(d, 420, 400, 50, WHITE); circ(d, 360, 400, 60, WHITE)
    if kind == 'foggy':
        cloud((205, 212, 228, 255), 0, -50)
        for y, x0 in [(380, 70), (420, 120), (460, 60)]: line(d, [(x0, y), (x0 + 330, y)], (190, 198, 218, 255), 22)
    if kind == 'snowy':
        cloud((215, 225, 245, 255), 0, -50)
        for x, y in [(150, 400), (260, 440), (370, 400)]: [line(d, [(x + 34 * math.sin(math.radians(a)), y - 34 * math.cos(math.radians(a))), (x - 34 * math.sin(math.radians(a)), y + 34 * math.cos(math.radians(a)))], (150, 200, 255, 255), 9) for a in (0, 60, 120)]
    return im

def _calendar():
    im, d = canvas(); rr(d, (60, 90, 452, 460), 44, WHITE, (110, 100, 150, 255), 14); rr(d, (60, 90, 452, 190), 44, (235, 80, 120, 255), (170, 40, 80, 255), 14); d.rectangle((62, 150, 450, 190), fill=(235, 80, 120, 255))
    for x in (150, 362): rr(d, (x - 12, 50, x + 12, 130), 12, (110, 100, 150, 255))
    for r in range(3):
        for c in range(4): circ(d, 130 + c * 84, 250 + r * 66, 20, (235, 80, 120, 255) if (r, c) == (1, 2) else (225, 220, 240, 255))
    return im

def _loop():
    im, d = canvas(); d.arc((70, 70, 442, 442), 210, 470, fill=(120, 90, 220, 255), width=44); poly(d, [(400, 120), (470, 235), (340, 240)], (120, 90, 220, 255)); heart(d, 256, 262, 130, (255, 110, 160, 255)); return im

def _check():
    im, d = canvas(); circ(d, 256, 256, 215, (70, 200, 110, 255), (40, 140, 70, 255), 14); line(d, [(140, 270), (225, 355), (380, 170)], WHITE, 48); return im

def _book():
    im, d = canvas(); poly(d, [(256, 110), (80, 80), (80, 400), (256, 440)], (255, 130, 170, 255), (190, 60, 110, 255), 12); poly(d, [(256, 110), (432, 80), (432, 400), (256, 440)], (255, 160, 190, 255), (190, 60, 110, 255), 12)
    for y in (170, 230, 290): line(d, [(120, y - 8 * (y / 230)), (225, y + 10)], (255, 235, 245, 255), 10); line(d, [(287, y + 10), (392, y - 8 * (y / 230))], (255, 235, 245, 255), 10)
    return im

def _pen():
    im, d = canvas(); poly(d, [(400, 50), (460, 110), (190, 380), (110, 400), (130, 320)], (255, 205, 80, 255), (200, 130, 20, 255), 12); poly(d, [(130, 320), (190, 380), (110, 400)], (255, 235, 200, 255), (200, 130, 20, 255), 8); poly(d, [(110, 400), (122, 372), (138, 388)], INK); return im

def _pages():
    im, d = canvas()
    for k, (x, y) in enumerate([(110, 100), (150, 70), (190, 40)]): rr(d, (x, y, x + 240, y + 330), 18, (255, 250, 240, 255), (180, 140, 80, 255), 10); [line(d, [(x + 40, y + 70 + j * 50), (x + 200, y + 70 + j * 50)], (210, 190, 150, 255), 9) for j in range(4)]
    return im

def _bookmark():
    im, d = canvas(); poly(d, [(150, 40), (362, 40), (362, 470), (256, 380), (150, 470)], (235, 70, 110, 255), (160, 30, 70, 255), 12); heart(d, 256, 160, 100, (255, 200, 215, 255)); return im

def _bot_ok():
    im, d = canvas(); line(d, [(256, 70), (256, 130)], (140, 145, 165, 255), 14); circ(d, 256, 60, 26, (90, 235, 255, 255), (50, 160, 190, 255), 6)
    rr(d, (80, 130, 432, 420), 70, (200, 208, 228, 255), (110, 118, 145, 255), 14); rr(d, (115, 185, 397, 300), 40, (40, 45, 70, 255)); circ(d, 190, 242, 28, (90, 235, 255, 255)); circ(d, 322, 242, 28, (90, 235, 255, 255))
    circ(d, 400, 400, 90, (70, 200, 110, 255), WHITE, 12); line(d, [(360, 400), (392, 435), (445, 365)], WHITE, 24); return im

def _shield_bot():
    im, d = canvas(); poly(d, [(256, 30), (450, 100), (430, 330), (256, 480), (82, 330), (62, 100)], (120, 90, 220, 255), (70, 50, 160, 255), 14); heart(d, 256, 250, 220, (255, 255, 255, 255)); return im

def build():
    G = 'Garden'
    petals = {'tulip': ((255, 90, 130), (255, 220, 90)), 'daisy': ((255, 255, 255), (255, 205, 60)), 'lily': ((255, 170, 210), (255, 200, 80)),
              'sunflower': ((255, 210, 50), (130, 80, 40)), 'orchid': ((190, 120, 240), (255, 220, 90)), 'rose': ((235, 50, 85), (255, 220, 90))}
    for k, (pc, cc) in petals.items():
        reg(f'gd_bloom_{k}', _flower(pc, cc, 'daisy' if k == 'rose' else k), G, {'tulip': '🌷', 'daisy': '🌼', 'lily': '🌸', 'sunflower': '🌻', 'orchid': '🪻', 'rose': '🌹'}[k])
        reg(f'gd_bud_{k}', _bud(pc), G, '🌱')
    reg('gd_seed', _seed(), G, '🌰'); reg('gd_sprout', _sprout(), G, '🌱'); reg('gd_wilted', _wilted(), G, '🥀'); reg('gd_watercan', _can(), G, '💧'); reg('gd_drop', _drop(), G, '💧')
    reg('gd_sun', _sun(), G, '☀️'); reg('gd_pot', _pot(), G, '🪴', ['🪴']); reg('gd_shears', _shears(), G, '✂️'); reg('gd_seedbag', _bag(), G, '🌱'); reg('gd_bouquet', _bouquet(), G, '💐')
    K = 'Sky'
    reg('sk_star_pink', _star((255, 130, 180)), K, '⭐'); reg('sk_star_blue', _star((110, 180, 255)), K, '⭐'); reg('sk_star_gold', _star((255, 205, 70), True), K, '🌟'); reg('sk_star_violet', _star((190, 130, 245)), K, '⭐')
    reg('sk_star_mint', _star((120, 230, 180)), K, '⭐'); reg('a_sk_comet', _comet(), K, '☄️', ['☄️']); reg('a_sk_wish', _wish(), K, '🌠', ['🌠'])
    for i in range(8): reg(f'sk_moon_{i}', _moon(i), K, '🌑🌒🌓🌔🌕🌖🌗🌘'[i])
    reg('sk_constellation', _constellation(), K, '✨'); reg('sk_telescope', _telescope(), K, '🔭', ['🔭']); reg('sk_galaxy', _galaxy(), K, '🌌', ['🌌'])
    V = 'Vault'
    reg('vt_vault', _vault(), V, '🏦'); reg('vt_lock', _lock(), V, '🔒'); reg('vt_unlock', _lock(True), V, '🔓', ['🔓']); reg('vt_key', _key(), V, '🔑', ['🔑']); reg('vt_scroll', _scroll(), V, '📜', ['📜']); reg('vt_seal', _seal(), V, '💌')
    W = 'Whisper'
    reg('ws_mask', _mask(), W, '🎭', ['🎭']); reg('ws_envelope', _envelope(), W, '💌'); reg('ws_question', _qmark(), W, '❓', ['❓']); reg('ws_eye', _eye(), W, '👁️'); reg('ws_feather', _feather(), W, '🪶', ['🪶']); reg('ws_quill', _quill(), W, '🖋️')
    U = 'Aura'
    for n, c in [('ember', (255, 110, 60)), ('tide', (60, 170, 240)), ('bloom', (255, 130, 190)), ('gale', (120, 215, 190)), ('dusk', (150, 100, 230)), ('dawn', (255, 185, 90)), ('frost', (130, 210, 250)), ('star', (255, 205, 80))]:
        reg(f'a_au_{n}', _orb(c, n), U, {'ember': '🔥', 'tide': '🌊', 'bloom': '🌸', 'gale': '🌬️', 'dusk': '🌆', 'dawn': '🌅', 'frost': '❄️', 'star': '⭐'}[n])
    M = 'Mood'
    for k, fb in (('sunny', '☀️'), ('cloudy', '⛅'), ('stormy', '⛈️'), ('rainbow', '🌈'), ('foggy', '🌫️'), ('snowy', '❄️')): reg(f'mo_{k}', _weather(k), M, fb)
    R = 'Ritual'
    reg('rt_calendar', _calendar(), R, '📅', ['📅']); reg('rt_loop', _loop(), R, '🔁', ['🔁']); reg('rt_check', _check(), R, '✅')
    D = 'Duet'
    reg('du_book', _book(), D, '📖', ['📖']); reg('du_pen', _pen(), D, '🖊️', ['🖊️']); reg('du_pages', _pages(), D, '📚', ['📚']); reg('du_bookmark', _bookmark(), D, '🔖', ['🔖'])
    T_ = 'Trust'
    reg('tr_bot_ok', _bot_ok(), T_, '🤖', ['🤖']); reg('tr_shield_bot', _shield_bot(), T_, '🛡️')
