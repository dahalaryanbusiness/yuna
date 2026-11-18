"""Hearts, love, flirty/spicy (kept playful, nothing explicit)."""
from .base import *

def _glossy(c):
    im, d = canvas(); col = COL[c]
    heart(d, 256, 262, 430, A(col), dark(col), 14); heart(d, 246, 246, 370, lite(col, .25))
    d.ellipse((120, 120, 215, 185), fill=(255, 255, 255, 190)); d.ellipse((135, 195, 165, 225), fill=(255, 255, 255, 170)); return im

def _plain(c):
    im, d = canvas(); col = COL[c]
    heart(d, 256, 262, 430, A(col), dark(col), 14); shine(d, 150, 150, 38); return im

def _outline(c):
    im, d = canvas(); col = COL[c]
    heart(d, 256, 262, 430, (255, 255, 255, 40), dark(col, .8), 40); heart(d, 256, 262, 430, (0, 0, 0, 0), A(col), 26)
    ell(d, (118, 112, 168, 150), A(lite(col, .6))); return im

def _sparkle(c):
    im, d = canvas(); col = COL[c]
    heart(d, 250, 285, 360, A(col), dark(col), 14); shine(d, 160, 190, 30)
    for x, y, r in [(400, 100, 70), (455, 210, 40), (90, 90, 38)]: poly(d, sparkle4(x, y, r), (255, 245, 170, 255), (255, 200, 60, 255), 5)
    return im

def _double(c):
    im, d = canvas(); col = COL[c]
    heart(d, 310, 215, 300, A(lite(col, .45)), dark(col, .8), 12)
    heart(d, 215, 300, 330, A(col), dark(col), 14); shine(d, 140, 215, 28); return im

def _broken(c):
    col = COL[c]; im, d = canvas(); heart(d, 256, 262, 430, A(col), dark(col), 14); shine(d, 150, 150, 38)
    crack = [(256, 60), (226, 150), (290, 215), (236, 290), (300, 360), (256, 470)]
    mL = Image.new('L', (S, S), 0); ImageDraw.Draw(mL).polygon([(0, 0), (256, 0)] + crack[::1] + [(256, 512), (0, 512)], fill=255)
    mL = Image.new('L', (S, S), 0); ImageDraw.Draw(mL).polygon([(0, 0), (256, 0), *crack, (256, 512), (0, 512)], fill=255)
    left = Image.new('RGBA', (S, S), T); left.paste(im, (0, 0), mL)
    right = Image.new('RGBA', (S, S), T); right.paste(im, (0, 0), Image.eval(mL, lambda v: 255 - v))
    out = Image.new('RGBA', (S, S), T)
    out.alpha_composite(left.rotate(9, center=(256, 420), resample=Image.BICUBIC), (-18, 6)); out.alpha_composite(right.rotate(-9, center=(256, 420), resample=Image.BICUBIC), (18, 6)); return out

def _ribbon(c):
    im, d = canvas(); col = COL[c]; rc = COL['white'] if c != 'white' else COL['pink']
    heart(d, 256, 285, 400, A(col), dark(col), 14); shine(d, 160, 190, 32)
    poly(d, [(256, 120), (140, 60), (150, 170)], A(rc), dark(rc, .6), 8); poly(d, [(256, 120), (372, 60), (362, 170)], A(rc), dark(rc, .6), 8)
    circ(d, 256, 120, 32, A(rc), dark(rc, .6), 8); return im

HEART_STYLES = dict(heart=_plain, loveg=_glossy, loveol=_outline, lovesp=_sparkle, lovedb=_double, lovebk=_broken, loverb=_ribbon)
HEART_FB = dict(red='❤️', orange='🧡', yellow='💛', green='💚', blue='💙', purple='💜', black='🖤', white='🤍', brown='🤎', pink='🩷', hotpink='💖')
HEART_REP = {'heart_orange': ['🧡'], 'heart_brown': ['🤎'], 'loverb_hotpink': ['💝'], 'lovesp_pink': ['💓'], 'lovedb_pink': ['💟'], 'lovebk_red': ['❣️']}

def lock_heart(c):
    im, d = canvas(); col = COL[c]
    d.arc((150, 50, 362, 300), 180, 360, fill=(180, 185, 200, 255), width=40); line(d, [(170, 175), (170, 250)], (180, 185, 200, 255), 40); line(d, [(342, 175), (342, 250)], (180, 185, 200, 255), 40)
    rr(d, (90, 230, 422, 470), 46, A(col), dark(col)); heart(d, 256, 355, 120, WHITE, None); return im

def chili(c):
    im, d = canvas(); col = COL[c]
    pts = []
    for i in range(60):
        t = i / 59; x = (1 - t) ** 2 * 130 + 2 * (1 - t) * t * 440 + t ** 2 * 400; y = (1 - t) ** 2 * 150 + 2 * (1 - t) * t * 150 + t ** 2 * 440
        pts.append((x, y, 66 * (1 - t) ** .55 + 8))
    for x, y, r in pts: circ(d, x, y, r + 11, dark(col))
    for x, y, r in pts: circ(d, x, y, r, A(col))
    for x, y, r in pts[8:34:3]: circ(d, x - r * .35, y - r * .4, r * .22, (255, 255, 255, 140))
    poly(d, [(95, 150), (120, 80), (200, 70), (185, 120), (165, 175)], (70, 170, 85, 255), (35, 100, 50, 255), 9)
    line(d, [(110, 110), (80, 60)], (50, 130, 60, 255), 18); return im

def lips(c):
    im, d = canvas(); col = COL[c]
    poly(d, [(60, 255), (150, 160), (256, 205), (362, 160), (452, 255), (256, 290)], A(col), dark(col), 12)
    poly(d, [(60, 255), (256, 290), (452, 255), (390, 380), (256, 440), (122, 380)], A(lite(col, .1)), dark(col), 12)
    line(d, [(70, 258), (256, 292), (442, 258)], dark(col, .5), 10); d.ellipse((190, 330, 290, 365), fill=(255, 255, 255, 120)); return im

def kiss(c):
    im, d = canvas(); col = COL[c]
    poly(d, [(60, 270), (150, 160), (256, 200), (362, 160), (452, 270), (256, 410)], A(col), dark(col), 12)
    line(d, [(80, 272), (256, 300), (432, 272)], dark(col, .5), 10); heart(d, 420, 100, 95, A(lite(col, .3)), dark(col), 6); return im

def devil(c):
    im, d = canvas(); col = COL[c]
    poly(d, [(110, 190), (80, 40), (210, 130)], (230, 60, 70, 255), (140, 20, 30, 255), 9); poly(d, [(402, 190), (432, 40), (302, 130)], (230, 60, 70, 255), (140, 20, 30, 255), 9)
    circ(d, 256, 285, 205, A(col), dark(col), 14)
    line(d, [(150, 230), (215, 255)], INK, 14); line(d, [(362, 230), (297, 255)], INK, 14)
    ell(d, (160, 265, 210, 310), INK); ell(d, (302, 265, 352, 310), INK)
    d.arc((170, 330, 350, 420), 15, 165, fill=INK, width=14); line(d, [(335, 365), (365, 345)], INK, 12)
    poly(d, [(215, 385), (232, 420), (250, 385)], WHITE, None); return im

def potion(c):
    im, d = canvas(); col = COL[c]
    rr(d, (210, 40, 302, 120), 14, (170, 120, 70, 255), (100, 60, 30, 255), 8); rr(d, (222, 110, 290, 220), 8, (225, 235, 250, 230), (140, 150, 180, 255), 8)
    circ(d, 256, 335, 150, (225, 235, 250, 230), (140, 150, 180, 255), 12)
    d.pieslice((106, 185, 406, 485), 0, 180, fill=A(col)); d.chord((106, 235, 406, 485), 0, 180, fill=A(col)); d.rectangle((120, 300, 392, 345), fill=A(col))
    heart(d, 256, 360, 110, A(lite(col, .6)), None); shine(d, 175, 270, 24); return im

def scent(c):
    im, d = canvas(); col = COL[c]
    rr(d, (190, 40, 322, 110), 14, (255, 205, 80, 255), (200, 140, 20, 255), 8); rr(d, (226, 100, 286, 170), 6, (205, 205, 225, 255), (130, 130, 160, 255), 6)
    rr(d, (120, 160, 392, 465), 56, A(col), dark(col)); heart(d, 256, 320, 110, A(lite(col, .7)), None); shine(d, 170, 230, 24); return im

def rose_top(c):
    im, d = canvas(); col = COL[c]; line(d, [(256, 300), (256, 480)], (60, 160, 80, 255), 24)
    ell(d, (256, 380, 380, 440), (90, 200, 110, 255), (40, 120, 60, 255), 8); ell(d, (132, 340, 256, 400), (90, 200, 110, 255), (40, 120, 60, 255), 8)
    circ(d, 256, 190, 150, A(col), dark(col), 12); circ(d, 256, 190, 105, A(lite(col, .1)), dark(col), 8); circ(d, 256, 190, 62, A(col), dark(col), 8)
    d.arc((222, 156, 290, 224), 20, 300, fill=dark(col), width=8); shine(d, 200, 120, 28); return im

def candle_c(c):
    im, d = canvas(); col = COL[c]
    rr(d, (196, 220, 316, 450), 20, A(col), dark(col)); ell(d, (140, 425, 372, 485), (255, 215, 120, 255), (200, 140, 30, 255), 8)
    poly(d, [(256, 45), (210, 145), (226, 205), (286, 205), (302, 145)], (255, 150, 40, 255), None); poly(d, [(256, 100), (236, 165), (246, 200), (266, 200), (276, 165)], (255, 236, 120, 255), None); return im

def wink(): 
    from .people import face; return face('wink')

def build():
    for c in COLORS_ALL:
        for pre, fn in HEART_STYLES.items():
            name = f'{pre}_{c}'
            if len(name) > 27: continue
            if pre in ('lovesp', 'lovedb', 'loverb', 'lovebk', 'loveol') and c not in COLORS_16: continue
            reg(name, fn(c), 'Hearts', HEART_FB.get(c, '💖'), HEART_REP.get(name, ()))
    for c in COLORS_10: reg(f'lovelk_{c}', lock_heart(c), 'Hearts', '🔒')
    for c in ['red', 'orange', 'yellow', 'green', 'purple', 'black', 'pink', 'white']: reg(f'chili_{c}', chili(c), 'Flirty', '🌶️', ['🌶️'] if c == 'red' else [])
    for c in COLORS_16: reg(f'lips_{c}', lips(c), 'Flirty', '👄', ['👄'] if c == 'red' else [])
    for c in COLORS_16: reg(f'kiss_{c}', kiss(c), 'Flirty', '💋')
    for c in ['purple', 'red', 'pink', 'blue', 'green', 'black', 'orange', 'magenta']: reg(f'devil_{c}', devil(c), 'Flirty', '😈', ['😈'] if c == 'purple' else [])
    for c in COLORS_ALL[:20]: reg(f'potion_{c}', potion(c), 'Flirty', '🧪', ['🧪'] if c == 'pink' else [])
    for c in COLORS_16: reg(f'scent_{c}', scent(c), 'Flirty', '🧴')
    for c in COLORS_16: reg(f'rose_{c}', rose_top(c), 'Flirty', '🌹')
    for c in COLORS_10: reg(f'candle_{c}', candle_c(c), 'Flirty', '🕯️')
