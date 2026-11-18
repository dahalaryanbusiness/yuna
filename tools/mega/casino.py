"""Gambling: chips, dice, cards, roulette, slot symbols, multipliers."""
from .base import *

def chip(c, kind='plain', label=None):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 228, A(col), dark(col), 14)
    for i in range(8):
        a = i * math.pi / 4; x = 256 + 200 * math.sin(a); y = 256 - 200 * math.cos(a)
        poly(d, [(x + 38 * math.cos(a) - 22 * math.sin(a), y + 38 * math.sin(a) + 22 * math.cos(a)), (x - 38 * math.cos(a) - 22 * math.sin(a), y - 38 * math.sin(a) + 22 * math.cos(a)),
                 (x - 38 * math.cos(a) + 22 * math.sin(a), y - 38 * math.sin(a) - 22 * math.cos(a)), (x + 38 * math.cos(a) + 22 * math.sin(a), y + 38 * math.sin(a) - 22 * math.cos(a))], (255, 255, 255, 235), None)
    circ(d, 256, 256, 150, A(lite(col, .15)), dark(col), 10); circ(d, 256, 256, 120, A(col), dark(col), 6)
    if kind == 'star': d.polygon(star(256, 262, 90), fill=(255, 255, 255, 235))
    elif kind == 'heart': heart(d, 256, 262, 140, (255, 255, 255, 235), None)
    elif kind == 'val': text(d, label, 256, 258, 100 if len(label) <= 2 else 78 if len(label) == 3 else 62, (255, 255, 255, 255), 5, dark(col))
    return im

def die(n, c):
    col = COL[c]; im, d = canvas(); rr(d, (50, 50, 462, 462), 80, A(col), dark(col), 16); rr(d, (75, 75, 437, 437), 60, A(lite(col, .12)), None)
    P = {1: [(256, 256)], 2: [(160, 160), (352, 352)], 3: [(160, 160), (256, 256), (352, 352)], 4: [(160, 160), (352, 160), (160, 352), (352, 352)],
         5: [(160, 160), (352, 160), (256, 256), (160, 352), (352, 352)], 6: [(160, 150), (352, 150), (160, 256), (352, 256), (160, 362), (352, 362)]}[n]
    pc = (255, 255, 255, 255) if c in ('black', 'navy', 'brown', 'grey') or sum(col) < 450 else dark(col, .5)
    for x, y in P: circ(d, x, y, 34, pc)
    return im

def spade(d, cx, cy, s, f):
    heart_up = [(x, 2 * cy - y) for x, y in heart_pts(cx, cy - s * .08, s * 1.0)]; d.polygon(heart_up, fill=f)
    poly(d, [(cx, cy + s * .1), (cx - s * .32, cy + s * .62), (cx + s * .32, cy + s * .62)], f, None)
def club(d, cx, cy, s, f):
    for dx, dy in [(0, -.3), (-.3, .05), (.3, .05)]: circ(d, cx + dx * s, cy + dy * s, s * .27, f)
    poly(d, [(cx, cy), (cx - s * .3, cy + s * .62), (cx + s * .3, cy + s * .62)], f, None)
def diam(d, cx, cy, s, f): d.polygon([(cx, cy - s * .62), (cx + s * .42, cy), (cx, cy + s * .62), (cx - s * .42, cy)], fill=f)
def suit(d, k, cx, cy, s, f):
    if k == 'h': heart(d, cx, cy + s * .06, s * 1.05, f, None)
    elif k == 'd': diam(d, cx, cy, s, f)
    elif k == 's': spade(d, cx, cy, s, f)
    else: club(d, cx, cy, s, f)

def card(rank, k):
    im, d = canvas(); red = k in 'hd'; col = (225, 45, 70, 255) if red else (45, 45, 62, 255)
    rr(d, (95, 25, 417, 487), 36, (255, 255, 255, 255), (150, 155, 175, 255), 10)
    text(d, rank.upper(), 160, 105, 92 if len(rank) == 1 else 70, col); suit(d, k, 160, 190, 62, col); suit(d, k, 275, 300, 205, col); return im

def cardback(c):
    col = COL[c]; im, d = canvas(); rr(d, (95, 25, 417, 487), 36, (255, 255, 255, 255), (150, 155, 175, 255), 10); rr(d, (120, 50, 392, 462), 24, A(col), dark(col), 8)
    for y in range(95, 440, 70):
        for x in range(150, 380, 70): d.polygon(sparkle4(x + (35 if (y // 70) % 2 else 0), y, 24), fill=lite(col, .6))
    heart(d, 256, 256, 120, WHITE, dark(col), 6); return im

def joker():
    im, d = canvas(); rr(d, (95, 25, 417, 487), 36, (255, 255, 255, 255), (150, 155, 175, 255), 10)
    poly(d, [(150, 270), (170, 130), (230, 220), (256, 100), (282, 220), (342, 130), (362, 270)], (190, 90, 230, 255), (110, 40, 150, 255), 8)
    for x, y in [(170, 125), (256, 95), (342, 125)]: circ(d, x, y, 22, (255, 205, 80, 255), (200, 140, 20, 255), 6)
    circ(d, 256, 340, 90, (255, 235, 210, 255), (200, 150, 120, 255), 8); circ(d, 225, 325, 11, INK); circ(d, 287, 325, 11, INK); d.arc((215, 335, 297, 395), 20, 160, fill=(220, 40, 70, 255), width=10); return im

RED = {1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36}
def roul(n):
    c = 'green' if n == 0 else 'red' if n in RED else 'black'; col = COL[c]; im, d = canvas()
    circ(d, 256, 256, 225, A(col), (255, 215, 90, 255), 20); circ(d, 256, 256, 168, None, (255, 255, 255, 200), 8)
    text(d, str(n), 256, 262, 190 if n < 10 else 150, WHITE, 6, dark(col, .6)); return im

def wheel(rot=0):
    im, d = canvas(); circ(d, 256, 256, 235, (110, 60, 30, 255), (60, 30, 15, 255), 14)
    for i in range(24):
        a0 = rot + i * 15 - 90; fc = (30, 30, 40, 255) if i % 2 else (225, 45, 70, 255)
        if i == 0: fc = (50, 180, 90, 255)
        d.pieslice((60, 60, 452, 452), a0, a0 + 15, fill=fc, outline=(255, 215, 90, 255), width=3)
    circ(d, 256, 256, 120, (110, 60, 30, 255), (255, 215, 90, 255), 8); circ(d, 256, 256, 60, (255, 215, 90, 255), (200, 150, 30, 255), 8); circ(d, 256, 256, 20, WHITE)
    d.ellipse((395, 130, 435, 170), fill=WHITE); return im

def cherry():
    im, d = canvas(); line(d, [(170, 360), (240, 120), (330, 60)], (80, 150, 70, 255), 14); line(d, [(350, 380), (310, 130), (330, 60)], (80, 150, 70, 255), 14)
    for x, y in [(170, 370), (350, 390)]: circ(d, x, y, 90, (225, 35, 65, 255), (140, 10, 35, 255), 10); shine(d, x - 30, y - 40, 22)
    poly(d, [(330, 60), (440, 40), (400, 110)], (90, 190, 90, 255), (40, 120, 50, 255), 8); return im
def lemon():
    im, d = canvas(); ell(d, (60, 130, 452, 400), (255, 230, 70, 255), (200, 160, 20, 255), 14); poly(d, [(40, 265), (95, 225), (95, 305)], (255, 230, 70, 255), (200, 160, 20, 255), 10); poly(d, [(472, 265), (417, 225), (417, 305)], (255, 230, 70, 255), (200, 160, 20, 255), 10); shine(d, 190, 190, 40); return im
def bell():
    im, d = canvas(); poly(d, [(256, 40), (150, 170), (110, 360), (60, 400), (452, 400), (402, 360), (362, 170)], (255, 205, 70, 255), (200, 140, 20, 255), 14); circ(d, 256, 440, 40, (255, 205, 70, 255), (200, 140, 20, 255), 10); shine(d, 190, 190, 30); return im
def barsym():
    im, d = canvas(); rr(d, (40, 150, 472, 362), 30, (35, 35, 48, 255), (255, 215, 90, 255), 14); text(d, 'BAR', 256, 258, 140, (255, 215, 90, 255)); return im
def seven(c):
    im, d = canvas(); text(d, '7', 256, 262, 460, A(COL[c]), 14, dark(COL[c], .45)); return im
def clover():
    im, d = canvas()
    for a in (0, 90, 180, 270): 
        r = math.radians(a); cx = 256 + 90 * math.sin(r); cy = 230 - 90 * math.cos(r); heart(d, cx, cy + 10, 150, (70, 200, 110, 255), (30, 120, 60, 255), 8)
    line(d, [(256, 260), (290, 460)], (40, 130, 70, 255), 20); return im
def horseshoe():
    im, d = canvas(); d.arc((70, 40, 442, 412), 330, 210, fill=(190, 195, 210, 255), width=76); d.arc((70, 40, 442, 412), 330, 210, fill=(236, 239, 250, 255), width=28)
    for a in (-15, 25, 65, 115, 155, 195): r = math.radians(a); circ(d, 256 + 224 * math.cos(r), 226 + 224 * math.sin(r), 11, (90, 95, 110, 255))
    return im
def melon():
    im, d = canvas(); d.pieslice((40, 80, 472, 512), 180, 360, fill=(70, 190, 95, 255), outline=(30, 110, 50, 255), width=14); d.pieslice((80, 120, 432, 472), 180, 360, fill=(255, 90, 110, 255))
    for x in (170, 256, 342): ell(d, (x - 10, 250, x + 10, 285), INK); return im
def grape():
    im, d = canvas()
    for x, y in [(160, 150), (256, 150), (352, 150), (205, 235), (307, 235), (256, 320), (256, 400)][:6]: circ(d, x, y, 55, (150, 80, 210, 255), (90, 40, 140, 255), 8); shine(d, x - 14, y - 18, 12)
    circ(d, 256, 330, 55, (150, 80, 210, 255), (90, 40, 140, 255), 8); poly(d, [(256, 90), (330, 20), (380, 70), (300, 110)], (90, 190, 90, 255), (40, 120, 50, 255), 8); return im
def orange_f():
    im, d = canvas(); circ(d, 256, 285, 200, (255, 150, 40, 255), (190, 90, 10, 255), 14); poly(d, [(256, 90), (350, 30), (390, 90), (300, 120)], (90, 190, 90, 255), (40, 120, 50, 255), 8); shine(d, 180, 210, 38); return im
def bomb():
    im, d = canvas(); circ(d, 240, 300, 190, (40, 42, 55, 255), (15, 15, 25, 255), 12); shine(d, 170, 220, 36); line(d, [(330, 150), (390, 90), (420, 100)], (160, 130, 90, 255), 18)
    d.polygon(sparkle4(440, 85, 60, .3), fill=(255, 190, 40, 255)); return im
def wild():
    im, d = canvas(); poly(d, star(256, 270, 240, .5), (255, 205, 60, 255), (200, 140, 20, 255), 16); text(d, 'W', 256, 285, 170, (160, 40, 90, 255)); return im
def jackpot():
    im, d = canvas(); rr(d, (20, 130, 492, 382), 40, (225, 45, 70, 255), (255, 215, 90, 255), 16); text(d, '777', 256, 262, 170, (255, 235, 130, 255), 8, (140, 20, 40, 255)); return im
def coinflip(side):
    im, d = canvas(); circ(d, 256, 256, 215, (255, 205, 70, 255), (200, 140, 20, 255), 18); circ(d, 256, 256, 160, (255, 228, 120, 255), (225, 165, 40, 255), 10)
    if side == 'h': heart(d, 256, 262, 190, (255, 90, 130, 255), (180, 30, 80, 255), 8)
    else: d.polygon(star(256, 262, 115), fill=(220, 150, 30, 255), outline=(180, 110, 10, 255)); 
    return im

def pill(label, c, size=None):
    col = COL[c]; im, d = canvas(); rr(d, (20, 150, 492, 362), 100, A(col), dark(col), 16); rr(d, (45, 170, 467, 262), 60, A(lite(col, .25)), None)
    sz = size or (150 if len(label) <= 3 else 110 if len(label) <= 5 else 84 if len(label) <= 6 else 66)
    text(d, label, 256, 258, sz, (255, 255, 255, 255), 6, dark(col, .6)); return im

def pokertable():
    im, d = canvas(); ell(d, (20, 110, 492, 420), (95, 55, 30, 255), (55, 30, 15, 255), 12); ell(d, (60, 145, 452, 385), (45, 150, 90, 255), (25, 95, 55, 255), 10)
    for x, y, c in [(210, 250, 'red'), (256, 235, 'blue'), (300, 255, 'black')]: circ(d, x, y, 34, A(COL[c]), WHITE, 6)
    return im

def build():
    for c in COLORS_ALL:
        for k, pre in (('plain', 'chip'), ('star', 'chipst'), ('heart', 'chiphr')): 
            if k == 'plain' or c in COLORS_16: reg(f'{pre}_{c}', chip(c, k), 'Casino', '🪙')
    for lab, c in [('1', 'white'), ('5', 'red'), ('10', 'blue'), ('25', 'green'), ('50', 'orange'), ('100', 'black'), ('500', 'purple'), ('1k', 'gold'), ('5k', 'pink'), ('10k', 'cyan'), ('100k', 'magenta'), ('1m', 'crimson')]:
        reg(f'chipv_{lab}', chip(c, 'val', lab), 'Casino', '🪙')
    for c in ['red', 'white', 'black', 'blue', 'green', 'gold', 'pink', 'purple', 'orange', 'cyan']:
        for n in range(1, 7): reg(f'dice_{n}_{c}', die(n, c), 'Casino', '🎲')
    for r in ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']:
        for k in 'shdc': reg(f'card_{r}{k}', card(r, k), 'Cards', '🃏')
    for c in ['red', 'blue', 'black', 'purple', 'green', 'pink', 'gold', 'teal']: reg(f'cardback_{c}', cardback(c), 'Cards', '🃏')
    reg('card_joker', joker(), 'Cards', '🃏', ['🃏'])
    for n in range(37): reg(f'roul_{n}', roul(n), 'Roulette', '🎰')
    reg('roulette_wheel', wheel(), 'Roulette', '🎡'); reg('slot_cherry', cherry(), 'Slots', '🍒', ['🍒']); reg('slot_lemon', lemon(), 'Slots', '🍋', ['🍋']); reg('slot_bell', bell(), 'Slots', '🔔', ['🔔'])
    reg('slot_bar', barsym(), 'Slots', '🎰')
    for c in ['red', 'blue', 'gold', 'green', 'pink', 'purple', 'cyan', 'black']: reg(f'slot_seven_{c}', seven(c), 'Slots', '7️⃣')
    reg('slot_clover', clover(), 'Slots', '🍀', ['🍀']); reg('slot_horseshoe', horseshoe(), 'Slots', '🧲'); reg('slot_melon', melon(), 'Slots', '🍉', ['🍉']); reg('slot_grape', grape(), 'Slots', '🍇', ['🍇'])
    reg('slot_orange', orange_f(), 'Slots', '🍊', ['🍊']); reg('slot_bomb', bomb(), 'Slots', '💣', ['💣']); reg('slot_wild', wild(), 'Slots', '🌟'); reg('slot_jackpot', jackpot(), 'Slots', '🎰')
    reg('coin_heads', coinflip('h'), 'Casino', '🪙'); reg('coin_tails', coinflip('t'), 'Casino', '🪙'); reg('poker_table', pokertable(), 'Casino', '🃏')
    for lab, c in [('WIN', 'green'), ('LOSE', 'red'), ('PUSH', 'grey'), ('BET', 'gold'), ('ALL IN', 'crimson'), ('FOLD', 'grey'), ('RAISE', 'orange'), ('CALL', 'blue'), ('CHECK', 'teal'), ('JACKPOT', 'magenta'),
                   ('BUST', 'red'), ('HIT', 'green'), ('STAND', 'blue'), ('LUCKY', 'lime'), ('BLACKJACK', 'black'), ('CASINO', 'purple'), ('VIP', 'gold'), ('HOT', 'orange'), ('COLD', 'cyan'), ('RISK', 'red')]:
        reg('tag_' + lab.lower().replace(' ', ''), pill(lab, c), 'Casino', '🎰')
    for m, c in [('2', 'green'), ('3', 'teal'), ('5', 'blue'), ('10', 'purple'), ('25', 'magenta'), ('50', 'orange'), ('100', 'red'), ('1000', 'gold')]:
        reg(f'mult_x{m}', pill(f'x{m}', c), 'Casino', '✖️')
