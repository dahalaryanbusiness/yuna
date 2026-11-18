"""Family members, couples, family trees, faces and animals."""
from .base import *

YEL = (255, 214, 70)

# ------------------------------------------------------------------ faces
def face(kind, base=YEL):
    im, d = canvas(); o = dark(base, .6)
    circ(d, 256, 256, 225, A(base), o, 14); d.ellipse((120, 70, 260, 120), fill=(255, 255, 255, 90))
    eyes = 'dot'; mouth = 'smile'; extra = []
    cfg = dict(happy=('arc', 'big'), grin=('dot', 'grin'), laugh=('arcdown', 'open'), wink=('wink', 'smile'), blush=('arc', 'smile'), love=('heart', 'open'), kiss=('dot', 'kiss'), cool=('shades', 'smirk'),
               sad=('dot', 'frown'), cry=('dot', 'frown'), angry=('dot', 'frown'), shocked=('wide', 'o'), sleepy=('line', 'flat'), think=('dot', 'flat'), silly=('wink', 'tongue'), smirk=('dot', 'smirk'),
               shy=('dot', 'smile'), party=('dot', 'grin'), sick=('x', 'wavy'), dizzy=('spiral', 'wavy'), money=('dollar', 'grin'), angel=('arc', 'smile'), nervous=('wide', 'wavy'), plead=('big', 'frown'),
               zany=('zany', 'tongue'), relieved=('arcdown', 'smile'), star=('star', 'grin'), mute=('dot', 'flat'), proud=('arc', 'smirk'), sob=('arcdown', 'frown'), evil=('dot', 'smirk'), blank=('dot', 'flat'), tired=('line', 'o'), hush=('dot', 'flat'), zzz=('line', 'smile'), rich=('dollar', 'smile'))
    eyes, mouth = cfg[kind]
    ex, ey = 175, 225
    if eyes == 'dot': circ(d, 180, 230, 22, INK); circ(d, 332, 230, 22, INK)
    elif eyes == 'big': circ(d, 180, 230, 38, INK); circ(d, 332, 230, 38, INK); circ(d, 192, 215, 13, WHITE); circ(d, 344, 215, 13, WHITE)
    elif eyes == 'arc': d.arc((140, 205, 220, 265), 200, 340, fill=INK, width=16); d.arc((292, 205, 372, 265), 200, 340, fill=INK, width=16)
    elif eyes == 'arcdown': d.arc((140, 215, 220, 275), 20, 160, fill=INK, width=16); d.arc((292, 215, 372, 275), 20, 160, fill=INK, width=16)
    elif eyes == 'wink': circ(d, 180, 230, 22, INK); d.arc((292, 205, 372, 265), 200, 340, fill=INK, width=16)
    elif eyes == 'heart': heart(d, 180, 235, 100, (240, 50, 90, 255), None); heart(d, 332, 235, 100, (240, 50, 90, 255), None)
    elif eyes == 'shades': rr(d, (115, 195, 235, 265), 28, (30, 30, 45, 255)); rr(d, (277, 195, 397, 265), 28, (30, 30, 45, 255)); line(d, [(235, 215), (277, 215)], (30, 30, 45, 255), 12)
    elif eyes == 'wide': circ(d, 180, 230, 40, WHITE, INK, 8); circ(d, 332, 230, 40, WHITE, INK, 8); circ(d, 180, 230, 14, INK); circ(d, 332, 230, 14, INK)
    elif eyes == 'line': line(d, [(140, 235), (220, 235)], INK, 14); line(d, [(292, 235), (372, 235)], INK, 14)
    elif eyes == 'x': line(d, [(150, 205), (210, 260)], INK, 14); line(d, [(210, 205), (150, 260)], INK, 14); line(d, [(302, 205), (362, 260)], INK, 14); line(d, [(362, 205), (302, 260)], INK, 14)
    elif eyes == 'spiral': 
        for cx in (180, 332): d.arc((cx - 38, 192, cx + 38, 268), 0, 300, fill=INK, width=9); d.arc((cx - 18, 212, cx + 18, 248), 120, 400, fill=INK, width=9)
    elif eyes == 'dollar': text(d, '$', 180, 232, 100, (40, 140, 70, 255)); text(d, '$', 332, 232, 100, (40, 140, 70, 255))
    elif eyes == 'star': d.polygon(star(180, 230, 46), fill=(255, 190, 40, 255), outline=(200, 120, 10, 255)); d.polygon(star(332, 230, 46), fill=(255, 190, 40, 255), outline=(200, 120, 10, 255))
    elif eyes == 'zany': circ(d, 180, 230, 38, WHITE, INK, 8); circ(d, 332, 215, 22, INK); circ(d, 190, 245, 14, INK)
    M = dict(
        smile=lambda: d.arc((170, 270, 342, 400), 20, 160, fill=INK, width=16),
        big=lambda: (d.chord((170, 285, 342, 410), 0, 180, fill=(120, 30, 50, 255), outline=INK, width=10)),
        grin=lambda: (d.chord((150, 285, 362, 410), 0, 180, fill=WHITE, outline=INK, width=12), line(d, [(160, 345), (352, 345)], INK, 8)),
        open=lambda: (ell(d, (190, 300, 322, 410), (120, 30, 50, 255), INK, 10), ell(d, (215, 360, 297, 405), (240, 100, 120, 255))),
        kiss=lambda: (heart(d, 256, 355, 70, (240, 60, 100, 255), None), ),
        smirk=lambda: (d.arc((190, 290, 350, 380), 20, 120, fill=INK, width=16),),
        frown=lambda: d.arc((170, 340, 342, 440), 200, 340, fill=INK, width=16),
        flat=lambda: line(d, [(190, 355), (322, 355)], INK, 16),
        o=lambda: ell(d, (225, 320, 287, 400), (120, 30, 50, 255), INK, 10),
        tongue=lambda: (d.arc((170, 280, 342, 380), 20, 160, fill=INK, width=14), rr(d, (225, 340, 287, 410), 24, (240, 90, 120, 255), INK, 8)),
        wavy=lambda: line(d, [(180, 360), (215, 335), (250, 365), (285, 335), (330, 360)], INK, 14))
    M[mouth]()
    if kind in ('blush', 'love', 'shy', 'kiss', 'proud'): ell(d, (95, 290, 165, 335), (255, 120, 140, 150)); ell(d, (347, 290, 417, 335), (255, 120, 140, 150))
    if kind in ('cry', 'sob'): 
        for x in (180, 332): poly(d, [(x, 262), (x - 22, 320), (x + 22, 320)], (90, 180, 255, 255), None); circ(d, x, 322, 22, (90, 180, 255, 255))
    if kind == 'angry': line(d, [(130, 180), (220, 215)], INK, 18); line(d, [(382, 180), (292, 215)], INK, 18); d.ellipse((60, 60, 450, 450), outline=(235, 60, 60, 120), width=20)
    if kind == 'angel': d.ellipse((150, 15, 362, 75), outline=(255, 205, 70, 255), width=18)
    if kind == 'party': poly(d, [(256, 5), (170, 120), (342, 120)], (235, 80, 160, 255), (160, 30, 100, 255), 8); circ(d, 256, 12, 16, (255, 220, 80, 255))
    if kind == 'sick': ell(d, (60, 70, 450, 450), (130, 210, 120, 70))
    if kind == 'nervous': poly(d, [(430, 110), (410, 170), (450, 170)], (90, 180, 255, 255), None)
    if kind == 'think': line(d, [(130, 175), (220, 195)], INK, 12); line(d, [(382, 190), (292, 175)], INK, 12)
    if kind == 'hush': rr(d, (235, 330, 277, 480), 20, (250, 205, 170, 255), (190, 130, 90, 255), 8)
    if kind in ('sleepy', 'zzz', 'tired'): text(d, 'z', 420, 90, 80, (90, 150, 255, 255)); text(d, 'Z', 465, 40, 60, (90, 150, 255, 255))
    if kind == 'rich': poly(d, [(150, 70), (190, 10), (256, 55), (322, 10), (362, 70)], (255, 205, 70, 255), (200, 140, 20, 255), 8)
    if kind == 'evil': poly(d, [(110, 120), (80, 20), (200, 80)], (225, 55, 70, 255), None); poly(d, [(402, 120), (432, 20), (312, 80)], (225, 55, 70, 255), None); line(d, [(130, 190), (220, 215)], INK, 16); line(d, [(382, 190), (292, 215)], INK, 16)
    return im

FACES = dict(happy='😊', grin='😁', laugh='😂', wink='😉', blush='😳', love='😍', kiss='😘', cool='😎', sad='😢', cry='😭', angry='😠', shocked='😲', sleepy='😴', think='🤔', silly='😜', smirk='😏', shy='🥺', party='🥳',
             sick='🤢', dizzy='😵', money='🤑', angel='😇', nervous='😅', plead='🥺', zany='🤪', relieved='😌', star='🤩', mute='😐', proud='😌', sob='😩', evil='😈', blank='😑', tired='😩', hush='🤫', zzz='💤', rich='🤑')
FACE_REP = dict(happy=['😊', '🙂', '😄'], grin=['😁'], laugh=['😂'], wink=['😉'], blush=['😳'], love=['😍', '🥰'], kiss=['😘'], cool=['😎'], sad=['😢', '😕'], cry=['😭'], angry=['😠', '😡'], shocked=['😲', '😮'], sleepy=['😴', '🥱'], think=['🤔'],
                silly=['😛', '😜'], smirk=['😏'], shy=['🥺'], party=['🥳'], sick=['🤧'], dizzy=['😵'], money=['🤑'], nervous=['😅', '😰', '😬'], zany=['🤪'], relieved=['😌'], sob=['😩'], hush=['🤫'], blank=['😑'], tired=['😮‍💨'])

# ------------------------------------------------------------------ people
HAIR = dict(brown=(110, 70, 45), black=(40, 32, 38), blond=(235, 195, 90), red=(190, 80, 45), grey=(200, 202, 212), white=(240, 240, 248), auburn=(150, 60, 40))
ROLES = dict(  # hair style, hair colour, shirt colour, extras
    mom=('long', 'brown', 'hotpink', ('earring',)), dad=('short', 'black', 'blue', ('stubble',)), son=('short', 'brown', 'green', ('cap',)), daughter=('pigtails', 'blond', 'yellow', ('bow',)),
    brother=('messy', 'black', 'teal', ()), sister=('ponytail', 'auburn', 'purple', ()), baby=('tuft', 'brown', 'white', ('baby',)), grandma=('bun', 'white', 'lavender', ('glasses',)),
    grandpa=('bald', 'grey', 'brown', ('glasses', 'mustache')), aunt=('wavy', 'red', 'coral', ()), uncle=('short', 'brown', 'navy', ('beard',)), cousin=('curly', 'black', 'orange', ()))

def person(role, skin='light', size=S):
    style, hc, shirt, ex = ROLES[role]; sk = A(SKIN[skin]); sko = dark(SKIN[skin], .62); hcol = A(HAIR[hc]); hco = dark(HAIR[hc], .6); sc = A(COL[shirt])
    im, d = canvas(); baby = 'baby' in ex; hr = 150 if baby else 128; cy = 240 if baby else 232
    if style in ('long', 'wavy'): rr(d, (256 - hr - 24, cy - hr, 256 + hr + 24, 470 if style == 'long' else 420), 90, hcol, hco, 8)
    if style == 'pigtails':
        for sx in (-1, 1): circ(d, 256 + sx * (hr + 28), cy + 20, 56, hcol, hco, 8)
    if style == 'ponytail': circ(d, 256 + hr + 10, cy + 40, 60, hcol, hco, 8)
    if style == 'bun': circ(d, 256, cy - hr - 20, 58, hcol, hco, 8)
    # shoulders / shirt
    rr(d, (70, 400, 442, 560), 90, sc, dark(COL[shirt]), 10)
    if 'baby' in ex: heart(d, 256, 460, 60, (255, 150, 190, 255), None)
    # head
    ell(d, (256 - hr - 12, cy + 10, 256 - hr + 18, cy + 70), sk, sko, 6); ell(d, (256 + hr - 18, cy + 10, 256 + hr + 12, cy + 70), sk, sko, 6)
    circ(d, 256, cy, hr, sk, sko, 10)
    # hair front
    if style in ('short', 'messy', 'wavy', 'long', 'bun', 'pigtails', 'ponytail', 'curly'):
        d.pieslice((256 - hr - 6, cy - hr - 6, 256 + hr + 6, cy + hr + 6), 188, 352, fill=hcol, outline=hco, width=8)
        if style in ('long', 'wavy', 'bun', 'pigtails', 'ponytail'): d.pieslice((256 - hr + 10, cy - hr - 6, 256 + hr - 10, cy + hr - 60), 200, 340, fill=hcol)
    if style == 'curly':
        for i in range(7): a = math.radians(190 + i * 23); circ(d, 256 + (hr - 2) * math.cos(a), cy + (hr - 2) * math.sin(a), 34, hcol, hco, 6)
    if style == 'messy':
        for dx in (-70, 0, 70): poly(d, [(256 + dx - 28, cy - hr + 20), (256 + dx, cy - hr - 44), (256 + dx + 28, cy - hr + 20)], hcol, hco, 6)
    if style == 'tuft': line(d, [(256, cy - hr + 8), (270, cy - hr - 30), (300, cy - hr - 22)], hcol, 14)
    if style == 'bald':
        d.pieslice((256 - hr - 6, cy - 40, 256 + hr + 6, cy + hr + 6), 180, 200, fill=hcol); ell(d, (256 - hr - 8, cy - 25, 256 - hr + 34, cy + 55), hcol, hco, 6); ell(d, (256 + hr - 34, cy - 25, 256 + hr + 8, cy + 55), hcol, hco, 6)
    # face
    ey = cy + 8; ex = 62 if not baby else 56
    circ(d, 256 - ex, ey, 17 if not baby else 22, INK); circ(d, 256 + ex, ey, 17 if not baby else 22, INK); circ(d, 256 - ex + 5, ey - 6, 6, WHITE); circ(d, 256 + ex + 5, ey - 6, 6, WHITE)
    ell(d, (256 - ex - 40, ey + 28, 256 - ex + 10, ey + 62), (255, 130, 150, 130)); ell(d, (256 + ex - 10, ey + 28, 256 + ex + 40, ey + 62), (255, 130, 150, 130))
    d.arc((256 - 42, ey + 20, 256 + 42, ey + 90), 25, 155, fill=INK, width=11)
    if 'stubble' in ex_(ex):
        for x in range(-70, 80, 20): circ(d, 256 + x, cy + 100, 5, (90, 70, 60, 150))
    if 'beard' in ex_(ex): d.chord((256 - 100, cy + 20, 256 + 100, cy + hr + 40), 10, 170, fill=hcol, outline=hco, width=6); d.arc((256 - 42, ey + 30, 256 + 42, ey + 90), 25, 155, fill=INK, width=10)
    if 'mustache' in ex_(ex): ell(d, (256 - 62, ey + 40, 256 + 62, ey + 78), hcol, hco, 5)
    if 'glasses' in ex_(ex): circ(d, 256 - ex, ey, 40, None, (60, 50, 60, 255), 9); circ(d, 256 + ex, ey, 40, None, (60, 50, 60, 255), 9); line(d, [(256 - 22, ey), (256 + 22, ey)], (60, 50, 60, 255), 8)
    if 'cap' in ex_(ex): d.pieslice((256 - hr - 8, cy - hr - 8, 256 + hr + 8, cy + hr), 180, 360, fill=(235, 70, 80, 255), outline=(150, 30, 40, 255), width=8); rr(d, (256 - 30, cy - 50, 256 + 170, cy - 20), 14, (235, 70, 80, 255), (150, 30, 40, 255), 6)
    if 'bow' in ex_(ex):
        for sx in (-1, 1): poly(d, [(256 + sx * (hr + 28), cy - 70), (256 + sx * (hr + 100), cy - 110), (256 + sx * (hr + 100), cy - 30)], (255, 110, 170, 255), (190, 50, 110, 255), 6)
    if 'earring' in ex_(ex):
        for sx in (-1, 1): circ(d, 256 + sx * (hr + 2), cy + 80, 12, (255, 205, 70, 255), (200, 140, 20, 255), 4)
    return im if size == S else im.resize((size, size), Image.LANCZOS)
def ex_(e): return ROLES_CUR[0]
ROLES_CUR = [()]
_p = person
def person(role, skin='light', size=S):  # noqa: F811  (wrapper that sets the extras list for ex_)
    ROLES_CUR[0] = ROLES[role][3] + (('baby',) if role == 'baby' else ())
    return _p.__wrapped__(role, skin, size) if hasattr(_p, '__wrapped__') else _p(role, skin, size)

def group(members, heart_between=False, gap=None):
    """members: list of (role, skin). Draws them side by side, overlapping a bit."""
    im = Image.new('RGBA', (S, S), T); n = len(members); w = int(S * (0.62 if n == 2 else 0.5 if n == 3 else 0.42)); step = (S - w) // max(1, n - 1) if n > 1 else 0
    for i, (role, skin) in enumerate(members):
        p = person(role, skin).resize((w, w), Image.LANCZOS); y = 170 + (30 if role in ('baby', 'son', 'daughter') else 0) + (10 if n == 4 and i % 2 else 0)
        im.alpha_composite(p, (i * step if n > 1 else (S - w) // 2, y))
    if heart_between:
        d = ImageDraw.Draw(im); heart(d, 256, 150, 110, (255, 90, 140, 255), (180, 30, 80, 255), 8)
    return im

# ------------------------------------------------------------------ family objects
def famtree(c):
    col = COL[c]; im, d = canvas(); trunk = (130, 85, 50, 255)
    poly(d, [(225, 470), (240, 290), (170, 190), (195, 180), (256, 250), (320, 170), (345, 185), (275, 295), (290, 470)], trunk, dark((130, 85, 50), .55), 8)
    for x, y, r in [(256, 120, 100), (150, 180, 95), (362, 180, 95), (110, 270, 70), (402, 270, 70), (256, 220, 110), (190, 290, 70), (322, 290, 70)]: circ(d, x, y, r, A(col), dark(col), 8)
    for x, y, r in [(256, 120, 70), (150, 180, 65), (362, 180, 65), (256, 220, 80)]: circ(d, x, y, r, A(lite(col, .25)))
    for x, y in [(200, 110), (310, 160), (130, 210), (390, 220), (256, 230), (170, 300), (350, 300)]: heart(d, x, y, 58, (255, 90, 140, 255), (190, 40, 90, 255), 4)
    return im

def branch_leaf(c):
    col = COL[c]; im, d = canvas(); line(d, [(60, 470), (200, 330), (350, 240), (430, 90)], (130, 85, 50, 255), 22)
    for x, y, a in [(150, 380, -30), (250, 300, 20), (330, 270, -50), (390, 160, 25), (230, 360, 60)]:
        l = Image.new('RGBA', (S, S), T); ld = ImageDraw.Draw(l); ell(ld, (x - 55, y - 28, x + 55, y + 28), A(col), dark(col), 7); line(ld, [(x - 40, y), (x + 40, y)], dark(col), 5); im.alpha_composite(l.rotate(a, center=(x, y), resample=Image.BICUBIC))
    return im

def house_family():
    im, d = canvas(); poly(d, [(40, 250), (256, 50), (472, 250)], (230, 80, 100, 255), (150, 30, 55, 255), 12); rr(d, (90, 240, 422, 470), 8, (255, 235, 200, 255), (190, 150, 100, 255), 10)
    rr(d, (216, 330, 296, 470), 10, (150, 95, 55, 255), (90, 50, 20, 255), 6); heart(d, 256, 190, 80, (255, 255, 255, 255), None)
    for x in (130, 330): rr(d, (x, 290, x + 70, 360), 8, (150, 210, 255, 255), (80, 130, 190, 255), 6); return im

def cradle():
    im, d = canvas(); d.pieslice((60, 230, 452, 520), 0, 180, fill=(255, 160, 195, 255), outline=(190, 80, 120, 255), width=12); rr(d, (110, 150, 402, 330), 40, (255, 235, 245, 255), (190, 120, 150, 255), 10); circ(d, 256, 215, 56, (255, 220, 190, 255), (200, 150, 120, 255), 6)
    d.arc((60, 80, 452, 330), 200, 340, fill=(190, 80, 120, 255), width=14); return im

def bottle_baby():
    im, d = canvas(); rr(d, (170, 150, 342, 470), 50, (240, 250, 255, 255), (130, 170, 200, 255), 12); rr(d, (170, 280, 342, 470), 50, (255, 255, 255, 255), None); rr(d, (170, 330, 342, 470), 40, (250, 250, 255, 255), None)
    rr(d, (150, 120, 362, 190), 20, (255, 150, 190, 255), (190, 80, 120, 255), 8); poly(d, [(210, 120), (256, 30), (302, 120)], (255, 225, 190, 255), (200, 150, 110, 255), 8); heart(d, 256, 390, 70, (255, 130, 170, 255), None); return im
def pacifier():
    im, d = canvas(); ell(d, (130, 180, 382, 320), (255, 150, 190, 255), (190, 80, 120, 255), 12); circ(d, 256, 250, 38, (255, 235, 245, 255)); ell(d, (210, 320, 302, 450), (255, 225, 190, 255), (200, 150, 110, 255), 10); d.arc((190, 40, 322, 190), 180, 360, fill=(255, 150, 190, 255), width=22); return im
def rattle():
    im, d = canvas(); line(d, [(160, 470), (270, 270)], (255, 205, 70, 255), 36); circ(d, 330, 170, 120, (110, 190, 255, 255), (50, 110, 190, 255), 12); d.polygon(star(330, 170, 60), fill=(255, 235, 130, 255)); return im
def stroller():
    im, d = canvas(); d.pieslice((70, 100, 440, 420), 180, 360 + 90, fill=(255, 160, 195, 255), outline=(190, 80, 120, 255), width=12); rr(d, (70, 260, 440, 330), 12, (255, 200, 220, 255), (190, 80, 120, 255), 8)
    line(d, [(430, 140), (470, 60)], (120, 120, 140, 255), 18); circ(d, 160, 410, 50, (80, 85, 105, 255), (40, 42, 55, 255), 10); circ(d, 370, 410, 50, (80, 85, 105, 255), (40, 42, 55, 255), 10); return im
def wedding_cake():
    im, d = canvas(); 
    for y, w, c in [(380, 170, (255, 210, 225)), (290, 125, (255, 235, 245)), (210, 80, (255, 210, 225))]: rr(d, (256 - w, y, 256 + w, y + 90), 20, A(c), (200, 130, 160, 255), 8)
    heart(d, 256, 150, 80, (255, 90, 140, 255), (180, 30, 80, 255), 6); return im
def arch():
    im, d = canvas(); d.arc((70, 60, 442, 440), 180, 360, fill=(255, 245, 230, 255), width=36); line(d, [(88, 250), (88, 480)], (255, 245, 230, 255), 36); line(d, [(424, 250), (424, 480)], (255, 245, 230, 255), 36)
    for a in range(190, 360, 28): r = math.radians(a); circ(d, 256 + 186 * math.cos(r), 250 + 186 * math.sin(r), 30, A(COL['pink']), dark(COL['pink']), 5)
    return im
def rings_pair():
    im, d = canvas(); ell(d, (40, 170, 320, 450), None, (255, 205, 80, 255), 32); ell(d, (190, 170, 470, 450), None, (235, 238, 250, 255), 32); poly(d, [(110, 70), (170, 70), (200, 130), (140, 170), (80, 130)], (120, 210, 255, 255), (50, 130, 190, 255), 7); return im
def certificate():
    im, d = canvas(); rr(d, (60, 90, 452, 420), 14, (255, 248, 225, 255), (190, 150, 80, 255), 12); 
    for y in (170, 215, 260): line(d, [(120, y), (392, y)], (210, 180, 120, 255), 8)
    circ(d, 256, 350, 42, (230, 60, 90, 255), (150, 20, 50, 255), 8); heart(d, 256, 352, 40, WHITE, None); return im
def frame():
    im, d = canvas(); rr(d, (50, 50, 462, 462), 24, (200, 140, 80, 255), (120, 70, 30, 255), 12); rr(d, (95, 95, 417, 417), 8, (255, 240, 250, 255), (120, 70, 30, 255), 6); heart(d, 256, 265, 190, (255, 120, 170, 255), (190, 50, 110, 255), 8); return im
def heart_hands():
    im, d = canvas(); heart(d, 256, 250, 400, (255, 90, 140, 255), (180, 30, 80, 255), 12)
    for sx in (-1, 1): poly(d, [(256 + sx * 20, 470), (256 + sx * 190, 380), (256 + sx * 215, 250), (256 + sx * 120, 300)], (250, 205, 170, 255), (190, 130, 90, 255), 8); return im
def hug_icon():
    im, d = canvas(); circ(d, 170, 220, 100, (250, 206, 172, 255), (190, 140, 100, 255), 10); circ(d, 342, 220, 100, (226, 172, 128, 255), (160, 110, 70, 255), 10)
    for cx in (170, 342): circ(d, cx - 30, 210, 10, INK); circ(d, cx + 30, 210, 10, INK); d.arc((cx - 28, 220, cx + 28, 270), 25, 155, fill=INK, width=8)
    rr(d, (60, 330, 452, 470), 60, (255, 140, 180, 255), (190, 70, 120, 255), 10); heart(d, 256, 150, 90, (255, 90, 140, 255), (180, 30, 80, 255), 6); return im

# ------------------------------------------------------------------ animals
ANIMALS = {  # name: (body, belly/muzzle, ears, extra)
    'cat_orange': ((255, 170, 80), (255, 240, 220), 'pointy', 'whiskers'), 'cat_black': ((60, 60, 75), (110, 110, 130), 'pointy', 'whiskers'), 'cat_white': ((250, 248, 252), (255, 220, 230), 'pointy', 'whiskers'),
    'cat_grey': ((165, 170, 185), (235, 238, 245), 'pointy', 'whiskers'), 'dog_brown': ((190, 135, 85), (245, 225, 195), 'floppy', ''), 'dog_golden': ((240, 190, 100), (255, 240, 205), 'floppy', ''),
    'dog_white': ((250, 248, 252), (255, 225, 230), 'floppy', ''), 'bunny_white': ((250, 248, 252), (255, 220, 230), 'long', ''), 'bunny_pink': ((255, 190, 215), (255, 240, 245), 'long', ''),
    'bunny_brown': ((190, 140, 100), (245, 225, 205), 'long', ''), 'fox': ((255, 140, 60), (255, 248, 240), 'pointy', ''), 'panda': ((250, 250, 252), None, 'round_dark', 'panda'),
    'bear_brown': ((165, 110, 70), (235, 205, 165), 'round', ''), 'bear_polar': ((245, 248, 252), (225, 235, 245), 'round', ''), 'pig': ((255, 175, 195), (255, 140, 170), 'pointy_small', 'snout'),
    'frog': ((110, 205, 110), (200, 240, 170), 'none', 'frog'), 'chick': ((255, 225, 80), None, 'none', 'chick'), 'lion': ((255, 190, 80), (255, 235, 190), 'round', 'mane'),
    'tiger': ((255, 160, 60), (255, 245, 230), 'round', 'stripes'), 'cow': ((250, 250, 252), (255, 200, 210), 'floppy_small', 'spots'), 'koala': ((170, 175, 190), (235, 238, 245), 'round_big', ''),
    'mouse': ((190, 195, 210), (255, 220, 230), 'round_big', ''), 'monkey': ((170, 115, 75), (245, 215, 175), 'round', ''), 'wolf': ((140, 145, 165), (225, 228, 240), 'pointy', ''),
    'hamster': ((245, 200, 140), (255, 245, 230), 'round', ''), 'sheep': ((250, 250, 252), (60, 60, 75), 'floppy_small', 'wool'), 'raccoon': ((150, 155, 170), (245, 245, 250), 'round', 'mask'),
    'deer': ((200, 140, 90), (250, 230, 205), 'round', 'antlers'), 'unicorn': ((250, 248, 252), (255, 220, 235), 'pointy', 'horn'),
    'dragon_green': ((110, 215, 140), (255, 240, 170), 'horns', ''), 'dragon_red': ((235, 80, 80), (255, 220, 170), 'horns', ''), 'dragon_blue': ((100, 160, 250), (225, 240, 255), 'horns', ''), 'dragon_purple': ((170, 110, 235), (240, 225, 255), 'horns', '')}
ANIMAL_FB = dict(cat='🐱', dog='🐶', bunny='🐰', fox='🦊', panda='🐼', bear='🐻', pig='🐷', frog='🐸', chick='🐥', lion='🦁', tiger='🐯', cow='🐮', koala='🐨', mouse='🐭', monkey='🐵', wolf='🐺', hamster='🐹', sheep='🐑', raccoon='🦝', deer='🦌', unicorn='🦄', dragon='🐲')

def animal(name):
    body, belly, ears, extra = ANIMALS[name]; b = A(body); o = dark(body, .6); im, d = canvas(); dk = (50, 40, 50, 255)
    if extra == 'mane': circ(d, 256, 270, 235, (200, 120, 40, 255), (130, 70, 20, 255), 12)
    if extra == 'wool':
        for i in range(10): a = 2 * math.pi * i / 10; circ(d, 256 + 190 * math.cos(a), 270 + 170 * math.sin(a), 62, (255, 255, 255, 255), (205, 210, 225, 255), 6)
    if extra == 'antlers':
        for sx in (-1, 1): line(d, [(256 + sx * 100, 120), (256 + sx * 150, 40), (256 + sx * 200, 20)], (140, 90, 50, 255), 16); line(d, [(256 + sx * 140, 70), (256 + sx * 190, 80)], (140, 90, 50, 255), 12)
    if extra == 'horn': poly(d, [(256, 5), (225, 120), (287, 120)], (255, 215, 90, 255), (200, 150, 30, 255), 8)
    if ears == 'pointy':
        poly(d, [(80, 220), (90, 40), (215, 130)], b, o, 10); poly(d, [(432, 220), (422, 40), (297, 130)], b, o, 10); poly(d, [(110, 190), (112, 90), (180, 135)], A((255, 170, 190)), None); poly(d, [(402, 190), (400, 90), (332, 135)], A((255, 170, 190)), None)
    elif ears in ('round', 'round_big', 'round_dark'):
        r = 80 if ears == 'round_big' else 62; ec = (50, 40, 50, 255) if ears == 'round_dark' else b
        circ(d, 110, 120, r, ec, o, 10); circ(d, 402, 120, r, ec, o, 10); circ(d, 110, 120, r * .55, A((255, 190, 205)) if ears != 'round_dark' else ec, None); circ(d, 402, 120, r * .55, A((255, 190, 205)) if ears != 'round_dark' else ec, None)
    elif ears == 'long':
        ell(d, (120, 5, 225, 240), b, o, 10); ell(d, (287, 5, 392, 240), b, o, 10); ell(d, (150, 45, 195, 200), A((255, 175, 205)), None); ell(d, (317, 45, 362, 200), A((255, 175, 205)), None)
    elif ears in ('floppy', 'floppy_small'):
        k = 1 if ears == 'floppy' else .7; ell(d, (30, 100, 150 + 20 * k, 100 + 250 * k), A(dark(body, .82)), o, 10); ell(d, (362 - 20 * k, 100, 482, 100 + 250 * k), A(dark(body, .82)), o, 10)
    elif ears == 'pointy_small': poly(d, [(100, 190), (110, 80), (200, 140)], b, o, 10); poly(d, [(412, 190), (402, 80), (312, 140)], b, o, 10)
    elif ears == 'horns': poly(d, [(150, 150), (110, 20), (225, 110)], (255, 235, 150, 255), (200, 160, 50, 255), 8); poly(d, [(362, 150), (402, 20), (287, 110)], (255, 235, 150, 255), (200, 160, 50, 255), 8)
    ell(d, (70, 100, 442, 470), b, o, 14)
    if extra == 'frog':
        circ(d, 150, 120, 60, b, o, 10); circ(d, 362, 120, 60, b, o, 10); circ(d, 150, 120, 36, WHITE, dk, 6); circ(d, 362, 120, 36, WHITE, dk, 6); circ(d, 150, 120, 16, dk); circ(d, 362, 120, 16, dk)
    if extra == 'stripes':
        for sx in (-1, 1):
            for k in range(3): line(d, [(256 + sx * 205, 200 + k * 50), (256 + sx * 150, 215 + k * 50)], (110, 50, 20, 255), 14)
        line(d, [(256, 105), (256, 160)], (110, 50, 20, 255), 14)
    if extra == 'spots': ell(d, (90, 150, 190, 250), (50, 50, 60, 255)); ell(d, (340, 260, 420, 340), (50, 50, 60, 255))
    if extra == 'mask': ell(d, (95, 215, 230, 300), (50, 50, 65, 255)); ell(d, (282, 215, 417, 300), (50, 50, 65, 255)); line(d, [(256, 110), (256, 200)], (50, 50, 65, 255), 36)
    if extra == 'panda': ell(d, (120, 220, 215, 340), dk); ell(d, (297, 220, 392, 340), dk)
    if belly and extra not in ('panda',): ell(d, (150, 290, 362, 450), A(belly) if ears not in ('pointy_small',) or extra != 'snout' else A(belly), None)
    ec = WHITE if extra == 'panda' else dk
    if extra == 'chick': poly(d, [(215, 290), (297, 290), (256, 345)], (255, 150, 40, 255), (200, 90, 10, 255), 8)
    elif extra == 'snout': ell(d, (190, 290, 322, 400), A(belly), dark(belly, .6), 8); circ(d, 230, 345, 12, dark(belly, .5)); circ(d, 282, 345, 12, dark(belly, .5))
    else: ell(d, (226, 305, 286, 350), (255, 130, 160, 255) if extra != 'panda' else dk, dk, 4); d.arc((196, 330, 256, 390), 10, 170, fill=dk, width=8); d.arc((256, 330, 316, 390), 10, 170, fill=dk, width=8)
    circ(d, 180, 255, 24, ec); circ(d, 332, 255, 24, ec); circ(d, 188, 246, 8, WHITE); circ(d, 340, 246, 8, WHITE)
    ell(d, (110, 320, 165, 365), (255, 140, 170, 140)); ell(d, (347, 320, 402, 365), (255, 140, 170, 140))
    if extra == 'whiskers':
        for sx in (-1, 1): line(d, [(256 + sx * 100, 345), (256 + sx * 215, 325)], dk, 5); line(d, [(256 + sx * 100, 365), (256 + sx * 215, 375)], dk, 5)
    return im

def build():
    for k, e in FACES.items(): reg(f'face_{k}', face(k), 'Faces', e, FACE_REP.get(k, ()))
    for role in ROLES:
        for sk in SKIN: reg(f'{role}_{sk}', person(role, sk), 'Family', {'mom': '👩', 'dad': '👨', 'son': '👦', 'daughter': '👧', 'baby': '👶', 'grandma': '👵', 'grandpa': '👴'}.get(role, '🧑'), (['👧'] if (role, sk) == ('daughter', 'light') else ['👦'] if (role, sk) == ('son', 'light') else []))
    combos = [('couple', [('mom', 'light'), ('dad', 'light')], 1, '👫'), ('couple2', [('mom', 'tan'), ('dad', 'brown')], 1, '👫'), ('couple3', [('mom', 'dark'), ('dad', 'olive')], 1, '👫'), ('couple4', [('mom', 'pale'), ('dad', 'tan')], 1, '👫'),
              ('siblings', [('brother', 'light'), ('sister', 'light')], 0, '👫'), ('siblings2', [('brother', 'tan'), ('sister', 'brown')], 0, '👫'), ('siblings3', [('brother', 'dark'), ('sister', 'olive')], 0, '👫'),
              ('twins', [('son', 'pale'), ('daughter', 'pale')], 0, '👯'), ('mom_kid', [('mom', 'light'), ('daughter', 'light')], 0, '👩‍👧'), ('dad_kid', [('dad', 'tan'), ('son', 'tan')], 0, '👨‍👦'),
              ('mom_baby', [('mom', 'olive'), ('baby', 'olive')], 0, '👩‍👶'), ('dad_baby', [('dad', 'brown'), ('baby', 'brown')], 0, '👨‍👶'),
              ('family3', [('mom', 'light'), ('dad', 'light'), ('baby', 'light')], 0, '👨‍👩‍👦'), ('family3b', [('mom', 'brown'), ('dad', 'dark'), ('daughter', 'brown')], 0, '👨‍👩‍👧'),
              ('family4', [('mom', 'tan'), ('dad', 'pale'), ('son', 'light'), ('daughter', 'tan')], 0, '👨‍👩‍👧‍👦'), ('family4b', [('mom', 'olive'), ('dad', 'olive'), ('brother', 'olive'), ('sister', 'olive')], 0, '👨‍👩‍👧‍👦'),
              ('grandparents', [('grandma', 'light'), ('grandpa', 'light')], 1, '👵'), ('grandkid', [('grandpa', 'tan'), ('daughter', 'tan')], 0, '👴'), ('grandkid2', [('grandma', 'brown'), ('son', 'brown')], 0, '👵'),
              ('aunt_uncle', [('aunt', 'light'), ('uncle', 'tan')], 0, '🧑‍🤝‍🧑'), ('cousins', [('cousin', 'light'), ('cousin', 'brown')], 0, '🫂'), ('generations', [('grandma', 'pale'), ('mom', 'pale'), ('baby', 'pale')], 0, '👪')]
    for n, mem, hrt, fb in combos: reg(f'fam_{n}', group(mem, bool(hrt)), 'Family', fb, ['👨‍👧'] if n == 'dad_kid' else ['🫂'] if n == 'cousins' else ['👫'] if n == 'siblings' else ['🧑‍🤝‍🧑'] if n == 'aunt_uncle' else [])
    for c in ['green', 'pink', 'orange', 'gold', 'purple', 'blue', 'red', 'white', 'teal', 'magenta']: reg(f'famtree_{c}', famtree(c), 'Family', '🌳', ['🌳'] if c == 'green' else [])
    for c in ['green', 'orange', 'pink', 'gold', 'red', 'lime', 'teal', 'purple']: reg(f'branch_{c}', branch_leaf(c), 'Family', '🌿')
    for n, fn, fb, rep in [('home', house_family, '🏡', ['🏡']), ('cradle', cradle, '🍼', []), ('baby_bottle', bottle_baby, '🍼', ['🍼']), ('pacifier', pacifier, '🍼', []), ('rattle', rattle, '🧸', []), ('stroller', stroller, '🍼', []),
                           ('wedding_cake', wedding_cake, '🎂', []), ('wedding_arch', arch, '💒', ['💒']), ('rings_pair', rings_pair, '💍', []), ('certificate', certificate, '📜', []), ('photo_frame', frame, '🖼️', []), ('heart_hands', heart_hands, '🫶', []), ('hug', hug_icon, '🫂', [])]:
        reg(f'fam_{n}', fn(), 'Family', fb, rep)
    for n in ANIMALS: reg(f'an_{n}', animal(n), 'Pets', ANIMAL_FB[n.split('_')[0]], [])
