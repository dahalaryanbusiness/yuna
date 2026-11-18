"""Economy / shop / rank items, one per colour."""
from .base import *

def gem_c(c):
    col = COL[c]; im, d = canvas(); pts = [(150, 110), (362, 110), (450, 220), (256, 450), (62, 220)]
    poly(d, pts, A(col), dark(col)); poly(d, [(150, 110), (362, 110), (330, 220), (182, 220)], lite(col, .4), dark(col), 6)
    poly(d, [(62, 220), (182, 220), (256, 450)], dark(col, .8), dark(col), 6); poly(d, [(450, 220), (330, 220), (256, 450)], dark(col, .8), dark(col), 6); shine(d, 200, 150, 30); return im

def crown_c(c):
    col = COL[c]; im, d = canvas()
    poly(d, [(60, 400), (40, 140), (160, 260), (256, 90), (352, 260), (472, 140), (452, 400)], A(col), dark(col))
    rr(d, (60, 380, 452, 450), 16, A(lite(col, .1)), dark(col), 10)
    for x in (40, 256, 472): circ(d, x, 120 if x != 256 else 70, 30, (255, 245, 245, 255), dark(col), 8)
    for x, cc in [(150, 'red'), (256, 'cyan'), (362, 'green')]: circ(d, x, 415, 18, A(COL[cc]), None)
    shine(d, 130, 300, 28); return im

def ring_c(c):
    col = COL[c]; im, d = canvas()
    ell(d, (90, 170, 422, 480), None, (255, 205, 80, 255), 36); ell(d, (112, 192, 400, 458), None, (255, 235, 150, 255), 8)
    poly(d, [(190, 60), (322, 60), (362, 130), (256, 215), (150, 130)], A(col), dark(col), 9); poly(d, [(190, 60), (322, 60), (300, 120), (212, 120)], lite(col, .5), None); return im

def medal_c(c, label=None):
    col = COL[c]; im, d = canvas()
    poly(d, [(150, 20), (240, 20), (300, 210), (210, 210)], (230, 70, 90, 255), (150, 20, 50, 255), 8); poly(d, [(362, 20), (272, 20), (212, 210), (302, 210)], (70, 120, 235, 255), (30, 60, 150, 255), 8)
    circ(d, 256, 330, 150, A(col), dark(col), 14); circ(d, 256, 330, 112, A(lite(col, .2)), dark(col), 8)
    if label: text(d, label, 256, 332, 150, dark(col, .5))
    else: d.polygon(star(256, 330, 78), fill=dark(col, .6))
    return im

def trophy_c(c):
    col = COL[c]; im, d = canvas()
    d.arc((50, 90, 200, 270), 90, 270, fill=dark(col, .85), width=24); d.arc((312, 90, 462, 270), 270, 90, fill=dark(col, .85), width=24)
    poly(d, [(120, 60), (392, 60), (360, 240), (256, 320), (152, 240)], A(col), dark(col)); d.rectangle((232, 310, 280, 390), fill=dark(col, .85))
    rr(d, (150, 385, 362, 460), 16, (120, 75, 45, 255), (70, 40, 20, 255), 8); d.polygon(star(256, 170, 60), fill=lite(col, .7)); return im

def shield_c(c):
    col = COL[c]; im, d = canvas()
    poly(d, [(256, 40), (440, 100), (420, 300), (256, 475), (92, 300), (72, 100)], A(col), dark(col), 16)
    poly(d, [(256, 90), (390, 135), (375, 290), (256, 410), (137, 290), (122, 135)], lite(col, .35), None); heart(d, 256, 240, 150, WHITE, None); return im

def key_c(c):
    col = COL[c]; im, d = canvas(); k = A(col); o = dark(col)
    ell(d, (50, 150, 230, 330), k, o, 14); ell(d, (105, 205, 175, 275), T, o, 12); rr(d, (210, 225, 460, 265), 12, k, o, 8); rr(d, (380, 255, 420, 340), 8, k, o, 8); rr(d, (430, 255, 465, 320), 8, k, o, 8); return im

def lock_c(c, open_=False):
    col = COL[c]; im, d = canvas(); g = (175, 180, 195, 255)
    if open_: d.arc((160, 20, 352, 280), 180, 360, fill=g, width=40); line(d, [(168, 150), (168, 230)], g, 40)
    else: d.arc((160, 50, 352, 320), 180, 360, fill=g, width=40); line(d, [(168, 185), (168, 250)], g, 40); line(d, [(344, 185), (344, 250)], g, 40)
    rr(d, (100, 235, 412, 465), 40, A(col), dark(col)); circ(d, 256, 330, 34, dark(col, .5)); rr(d, (244, 340, 268, 410), 8, dark(col, .5)); return im

def ticket_c(c):
    col = COL[c]; im, d = canvas(); rr(d, (40, 150, 472, 362), 26, A(col), dark(col)); d.ellipse((10, 232, 70, 282), fill=T); d.ellipse((442, 232, 502, 282), fill=T)
    for y in range(170, 350, 26): line(d, [(150, y), (150, y + 12)], dark(col), 6)
    d.polygon(star(330, 256, 70), fill=lite(col, .8)); return im

def gift_c(c):
    col = COL[c]; rb = COL['white'] if c not in ('white', 'silver') else COL['red']; im, d = canvas()
    rr(d, (90, 230, 422, 460), 14, A(col), dark(col)); rr(d, (60, 170, 452, 250), 14, A(lite(col, .2)), dark(col)); d.rectangle((226, 170, 286, 460), fill=A(rb))
    ell(d, (130, 70, 256, 180), A(rb), dark(rb, .6), 10); ell(d, (256, 70, 382, 180), A(rb), dark(rb, .6), 10); circ(d, 256, 175, 26, A(rb), dark(rb, .6), 8); return im

def bill_c(c):
    col = COL[c]; im, d = canvas(); rr(d, (30, 120, 482, 392), 22, A(lite(col, .45)), dark(col), 12)
    rr(d, (60, 148, 452, 364), 12, None, dark(col, .8), 6); circ(d, 256, 256, 70, A(col), dark(col), 8); text(d, '$', 256, 258, 110, WHITE)
    circ(d, 120, 256, 20, A(col)); circ(d, 392, 256, 20, A(col)); return im

def bars_c(c):
    col = COL[c]; im, d = canvas()
    for x, y, w in [(70, 300, 230), (200, 300, 230), (135, 190, 230)]:
        poly(d, [(x + 30, y), (x + w, y), (x + w - 30, y + 110), (x, y + 110)], A(col), dark(col), 10); d.line([(x + 55, y + 22), (x + w - 25, y + 22)], fill=lite(col, .7), width=12)
    return im

def chest_c(c):
    col = COL[c]; im, d = canvas(); rr(d, (60, 230, 452, 450), 20, A(dark(col, .85)), dark(col, .5)); d.pieslice((60, 100, 452, 360), 180, 360, fill=A(col), outline=dark(col, .5), width=12)
    d.rectangle((60, 225, 452, 255), fill=(255, 205, 70, 255)); d.rectangle((226, 130, 286, 450), fill=(255, 205, 70, 255)); rr(d, (216, 260, 296, 340), 14, (255, 235, 130, 255), (200, 140, 20, 255), 8); circ(d, 256, 300, 12, (120, 70, 20, 255)); return im

def coin_c(c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 206, A(col), dark(col), 18); circ(d, 256, 256, 156, A(lite(col, .25)), dark(col), 10); heart(d, 256, 262, 170, A(dark(col, .8)), None); shine(d, 170, 150, 30); return im

def stack_c(c):
    col = COL[c]; im, d = canvas()
    for i, y in enumerate([400, 340, 280, 220]):
        ell(d, (110, y, 402, y + 80), dark(col, .8), dark(col, .5), 8); rr(d, (110, y + 35, 402, y + 70), 0, A(col), None); ell(d, (110, y, 402, y + 70), A(lite(col, .2)), dark(col, .5), 8)
    return im

def bag_c(c):
    col = COL[c]; im, d = canvas(); poly(d, [(190, 70), (322, 70), (290, 170), (222, 170)], A(dark(col, .85)), dark(col, .5), 10)
    ell(d, (80, 150, 432, 470), A(col), dark(col, .5)); rr(d, (200, 150, 312, 185), 10, (255, 90, 130, 255), (180, 30, 80, 255), 6); text(d, '$', 256, 330, 170, lite(col, .8)); return im

def star_c(c):
    col = COL[c]; im, d = canvas(); poly(d, star(256, 270, 230, .48), A(col), dark(col), 16); shine(d, 200, 170, 28); return im

def badge_c(c, glyph):
    col = COL[c]; im, d = canvas(); poly(d, regpoly(256, 256, 225, 8, math.pi / 8), A(col), dark(col), 16); circ(d, 256, 256, 150, A(lite(col, .25)), dark(col), 8)
    if isinstance(glyph, str): text(d, glyph, 256, 262, 170 if len(glyph) == 1 else 120, dark(col, .45))
    else: glyph(d, col)
    return im

def build():
    P = [(gem_c, 'gem', 'Gems', '💎', COLORS_ALL), (crown_c, 'crown', 'Ranks', '👑', COLORS_16), (ring_c, 'ring', 'Family', '💍', COLORS_16),
         (medal_c, 'medal', 'Ranks', '🏅', COLORS_10), (trophy_c, 'trophy', 'Ranks', '🏆', COLORS_16), (shield_c, 'shield', 'Ranks', '🛡️', COLORS_16),
         (key_c, 'key', 'Shop', '🗝️', COLORS_10), (lock_c, 'lock', 'Shop', '🔒', COLORS_10), (ticket_c, 'ticket', 'Shop', '🎟️', COLORS_16),
         (gift_c, 'gift', 'Shop', '🎁', COLORS_ALL), (bill_c, 'bill', 'Money', '💵', ['green', 'blue', 'red', 'gold', 'purple', 'pink', 'cyan', 'orange']),
         (bars_c, 'goldbar', 'Money', '🪙', ['gold', 'silver', 'pink', 'cyan', 'purple', 'brown']), (chest_c, 'chest', 'Shop', '🧰', COLORS_16),
         (coin_c, 'coin', 'Money', '🪙', COLORS_ALL), (stack_c, 'coins', 'Money', '💰', COLORS_16), (bag_c, 'cashbag', 'Money', '💰', COLORS_16),
         (star_c, 'star', 'Ranks', '⭐', COLORS_ALL)]
    for fn, pre, cat, fb, cols in P:
        for c in cols: reg(f'{pre}_{c}', fn(c), cat, fb)
    for c in COLORS_10: reg(f'unlock_{c}', lock_c(c, True), 'Shop', '🔓')
    for lab, c in [('1', 'gold'), ('2', 'silver'), ('3', 'brown')]: reg(f'medal_{lab}st' if lab == '1' else f'medal_{lab}nd' if lab == '2' else f'medal_{lab}rd', medal_c(c, lab), 'Ranks', '🥇' if lab == '1' else '🥈' if lab == '2' else '🥉', ['🥇'] if lab == '1' else ['🥈'] if lab == '2' else ['🥉'])
    for i, (nm, c) in enumerate([('bronze', 'brown'), ('silver', 'silver'), ('gold', 'gold'), ('platinum', 'cyan'), ('diamond', 'sky'), ('master', 'purple'), ('legend', 'red'), ('mythic', 'magenta'), ('rookie', 'green'), ('elite', 'indigo')]):
        reg(f'rank_{nm}', badge_c(c, str(i + 1)), 'Ranks', '🏅')
    for n in range(1, 31): reg(f'lvl_{n}', badge_c('pink', str(n)), 'Levels', '🔢')
