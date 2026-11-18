"""Shared drawing helpers + registry for the mega emoji pack (Pillow only)."""
import math, os, re, json, colorsys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'emojis')
MANIFEST = os.path.join(ROOT, 'src', 'lib', 'emoji_manifest.json')
S = 512
T = (0, 0, 0, 0)
FRAMES = 12

_FONTS = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf',
          '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Bold.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']
FONT = next((f for f in _FONTS if os.path.exists(f)), None)

# ---------------------------------------------------------------- colours
COL = dict(
    red=(235, 60, 80), crimson=(190, 25, 60), pink=(255, 125, 175), hotpink=(255, 70, 140), rose=(255, 150, 180),
    coral=(255, 110, 100), orange=(255, 150, 50), amber=(255, 190, 50), yellow=(255, 224, 70), gold=(255, 200, 60),
    lime=(170, 225, 60), green=(70, 200, 110), mint=(120, 230, 180), teal=(40, 180, 170), cyan=(60, 210, 235),
    sky=(110, 180, 255), blue=(60, 110, 240), navy=(45, 60, 150), indigo=(90, 80, 210), purple=(150, 90, 220),
    violet=(190, 120, 240), magenta=(220, 60, 200), lavender=(200, 170, 250), brown=(150, 100, 60),
    white=(250, 250, 252), silver=(190, 195, 210), grey=(130, 135, 150), black=(50, 50, 62),
)
COLORS_ALL = list(COL)
COLORS_16 = ['red', 'pink', 'hotpink', 'orange', 'yellow', 'gold', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'magenta', 'white', 'black']
COLORS_10 = ['red', 'pink', 'orange', 'gold', 'green', 'cyan', 'blue', 'purple', 'white', 'black']
SKIN = dict(pale=(255, 226, 208), light=(250, 206, 172), tan=(226, 172, 128), olive=(200, 148, 102), brown=(150, 103, 72), dark=(105, 70, 52))

def A(c, a=255): return (c[0], c[1], c[2], a)
def dark(c, k=.55): return A(tuple(int(v * k) for v in c[:3]))
def lite(c, k=.5): return A(tuple(int(v + (255 - v) * k) for v in c[:3]))
def mix(c1, c2, t): return A(tuple(int(a + (b - a) * t) for a, b in zip(c1[:3], c2[:3])))
WHITE = (255, 255, 255, 255)
INK = (55, 40, 60, 255)

# ---------------------------------------------------------------- canvas + primitives
def canvas():
    im = Image.new('RGBA', (S, S), T)
    return im, ImageDraw.Draw(im)
def ell(d, box, f, o=None, w=12): d.ellipse(box, fill=f, outline=o, width=w if o else 0)
def circ(d, cx, cy, r, f, o=None, w=12): ell(d, (cx - r, cy - r, cx + r, cy + r), f, o, w)
def rr(d, box, r, f, o=None, w=12): d.rounded_rectangle(box, r, fill=f, outline=o, width=w if o else 0)
def poly(d, pts, f, o=None, w=12):
    d.polygon(pts, fill=f)
    if o: d.line(list(pts) + [pts[0]], fill=o, width=w, joint='curve')
def line(d, pts, c, w=12): d.line(pts, fill=c, width=w, joint='curve')
def shine(d, x, y, r, a=170): d.ellipse((x - r, y - r * .6, x + r, y + r * .6), fill=(255, 255, 255, a))

def heart_pts(cx, cy, size, n=90):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        pts.append((cx + 16 * math.sin(t) ** 3 * size / 34, cy - (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * size / 34))
    return pts
def heart(d, cx, cy, size, f, o=None, w=10): poly(d, heart_pts(cx, cy, size), f, o, w)
def star(cx, cy, r, inner=.45, n=5, rot=0):
    pts = []
    for i in range(n * 2):
        a = rot + i * math.pi / n; rad = r if i % 2 == 0 else r * inner
        pts.append((cx + rad * math.sin(a), cy - rad * math.cos(a)))
    return pts
def sparkle4(cx, cy, r, inner=.22): return star(cx, cy, r, inner, 4)
def regpoly(cx, cy, r, n, rot=0): return [(cx + r * math.sin(rot + 2 * math.pi * i / n), cy - r * math.cos(rot + 2 * math.pi * i / n)) for i in range(n)]

def font(sz):
    return ImageFont.truetype(FONT, sz) if FONT else ImageFont.load_default()
def text(d, s, cx, cy, size, fill, stroke=0, sf=None):
    f = font(size)
    bb = d.textbbox((0, 0), s, font=f, stroke_width=stroke)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text((cx - w / 2 - bb[0], cy - h / 2 - bb[1]), s, font=f, fill=fill, stroke_width=stroke, stroke_fill=sf)

def finish(im, size=128): return im.resize((size, size), Image.LANCZOS)

# ---------------------------------------------------------------- frame helpers (animated emojis)
def spin(base):
    out = []
    for i in range(FRAMES):
        w = max(abs(math.cos(2 * math.pi * i / FRAMES)), .08); sc = base.resize((int(S * w), S), Image.LANCZOS)
        im = Image.new('RGBA', (S, S), T); im.paste(sc, ((S - sc.width) // 2, 0)); out.append(im)
    return out
def bounce(base, h=45):
    out = []
    for i in range(FRAMES):
        im = Image.new('RGBA', (S, S), T); im.paste(base, (0, int(-h * abs(math.sin(math.pi * i / FRAMES)))), base); out.append(im)
    return out
def pulse(base, amt=.14):
    out = []
    for i in range(FRAMES):
        k = 1 + amt * math.sin(2 * math.pi * i / FRAMES); n = int(S * k); sc = base.resize((n, n), Image.LANCZOS)
        im = Image.new('RGBA', (S, S), T); im.paste(sc, ((S - n) // 2, (S - n) // 2), sc); out.append(im)
    return out
def wiggle(base, deg=12):
    return [base.rotate(deg * math.sin(2 * math.pi * i / FRAMES), resample=Image.BICUBIC) for i in range(FRAMES)]
def glint(base):
    out = []
    for i in range(FRAMES):
        im = base.copy(); d = ImageDraw.Draw(im); t = i / FRAMES; k = 1 - abs(t - .5) * 2
        d.polygon(sparkle4(110 + t * 290, 120 + t * 170, 90 * k, .2), fill=(255, 255, 255, 255)); out.append(im)
    return out
def float_up(base):
    out = []
    for i in range(FRAMES):
        im = Image.new('RGBA', (S, S), T); im.paste(base, (int(10 * math.sin(2 * math.pi * i / FRAMES)), int(-30 * abs(math.sin(math.pi * i / FRAMES)))), base); out.append(im)
    return out
def flicker(makers):
    return [makers[i % len(makers)]() for i in range(FRAMES)]

def gif_frame(img):
    alpha = img.getchannel('A')
    p = img.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p.paste(255, alpha.point(lambda a: 255 if a < 110 else 0)); return p
def save_gif(frames, path, ms=75):
    fr = [gif_frame(f) for f in frames]
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=2, transparency=255, optimize=False)

# ---------------------------------------------------------------- registry
REG = {}
_old = set()

def init():
    """Names of emojis that exist from the original packs (never overwritten)."""
    prev = set()
    if os.path.exists(MANIFEST):
        prev = set(json.load(open(MANIFEST, encoding='utf8')))
    if os.path.isdir(OUT):
        for f in os.listdir(OUT):
            n = re.sub(r'^yuna_|\.(png|gif)$', '', f)
            if n not in prev: _old.add(n)

def reg(name, img, cat, fb='💖', rep=()):
    """img = one RGBA image (static) or a list of frames (animated)."""
    assert re.fullmatch(r'[a-z0-9_]{2,27}', name), f'bad emoji name: {name}'
    assert name not in REG, f'duplicate: {name}'
    if name in _old: return False
    REG[name] = dict(img=img, cat=cat, fb=fb, rep=list(rep))
    return True

def write_all():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for name, r in sorted(REG.items()):
        anim = isinstance(r['img'], list)
        for ext in ('png', 'gif'):
            p = os.path.join(OUT, f'yuna_{name}.{ext}')
            if os.path.exists(p) and (ext == 'png') == anim: os.remove(p)
        if anim: save_gif([finish(f) for f in r['img']], os.path.join(OUT, f'yuna_{name}.gif'))
        else: finish(r['img']).save(os.path.join(OUT, f'yuna_{name}.png'), optimize=True)
        manifest[name] = dict(c=r['cat'], f=r['fb'], a=1 if anim else 0, r=r['rep'])
    json.dump(manifest, open(MANIFEST, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    return manifest
