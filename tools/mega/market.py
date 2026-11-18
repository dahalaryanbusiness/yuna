"""Black market / underworld game-economy items (cartoon style, no weapons)."""
from .base import *

def mask_bandit(c):
    col = COL[c]; im, d = canvas(); poly(d, [(40, 190), (130, 150), (256, 200), (382, 150), (472, 190), (440, 330), (340, 340), (256, 290), (172, 340), (72, 330)], A(col), dark(col), 12)
    ell(d, (110, 220, 220, 300), (255, 255, 255, 255), dark(col), 8); ell(d, (292, 220, 402, 300), (255, 255, 255, 255), dark(col), 8); circ(d, 165, 262, 20, INK); circ(d, 347, 262, 20, INK); return im
def mask_ski(c):
    col = COL[c]; im, d = canvas(); ell(d, (70, 40, 442, 480), A(col), dark(col)); rr(d, (120, 190, 392, 270), 36, (30, 25, 35, 255)); rr(d, (190, 330, 322, 400), 30, (30, 25, 35, 255))
    circ(d, 190, 230, 14, WHITE); circ(d, 322, 230, 14, WHITE); return im
def shades(c):
    col = COL[c]; im, d = canvas(); rr(d, (50, 180, 240, 330), 50, A(col), dark(col, .5), 12); rr(d, (272, 180, 462, 330), 50, A(col), dark(col, .5), 12); line(d, [(240, 215), (272, 215)], dark(col, .5), 16)
    line(d, [(80, 215), (40, 180)], dark(col, .5), 14); line(d, [(432, 215), (472, 180)], dark(col, .5), 14); d.line([(85, 205), (130, 205)], fill=(255, 255, 255, 140), width=12); d.line([(307, 205), (352, 205)], fill=(255, 255, 255, 140), width=12); return im
def briefcase(c):
    col = COL[c]; im, d = canvas(); d.arc((170, 60, 342, 240), 180, 360, fill=dark(col, .6), width=30); rr(d, (50, 160, 462, 440), 36, A(col), dark(col)); d.line([(50, 290), (462, 290)], fill=dark(col), width=10)
    rr(d, (216, 265, 296, 325), 10, (255, 205, 70, 255), (200, 140, 20, 255), 6); return im
def crate(c):
    col = COL[c]; im, d = canvas(); rr(d, (50, 80, 462, 460), 14, A(col), dark(col)); 
    for x in (50, 215, 345): d.rectangle((x, 80, x + 117, 460), fill=None)
    for y in (80, 215, 350): rr(d, (50, y, 462, y + 110), 6, A(lite(col, .08)), dark(col), 8)
    line(d, [(60, 95), (452, 445)], dark(col), 12); line(d, [(452, 95), (60, 445)], dark(col), 12); text(d, '?', 256, 270, 130, A(lite(col, .8))); return im
def parcel(c):
    col = COL[c]; im, d = canvas(); poly(d, [(60, 190), (256, 110), (452, 190), (256, 270)], A(lite(col, .25)), dark(col), 10); poly(d, [(60, 190), (256, 270), (256, 470), (60, 390)], A(col), dark(col), 10); poly(d, [(452, 190), (256, 270), (256, 470), (452, 390)], A(dark(col, .8)), dark(col), 10)
    line(d, [(156, 150), (356, 230)], (240, 220, 180, 255), 22); rr(d, (280, 330, 400, 390), 8, (255, 255, 255, 230)); return im
def hood(c):
    col = COL[c]; im, d = canvas(); poly(d, [(256, 30), (90, 210), (60, 470), (452, 470), (422, 210)], A(col), dark(col), 12); ell(d, (150, 160, 362, 400), (25, 20, 32, 255), dark(col), 8)
    ell(d, (190, 250, 240, 290), (255, 240, 120, 255)); ell(d, (272, 250, 322, 290), (255, 240, 120, 255)); return im
def lockpick():
    im, d = canvas(); line(d, [(80, 440), (330, 190)], (200, 205, 220, 255), 20); line(d, [(330, 190), (420, 100), (460, 140)], (200, 205, 220, 255), 20); rr(d, (40, 400, 140, 480), 14, (150, 90, 50, 255), (90, 50, 20, 255), 8)
    rr(d, (250, 300, 420, 400), 16, (255, 205, 70, 255), (200, 140, 20, 255), 8); circ(d, 335, 350, 14, (120, 70, 20, 255)); return im
def burner():
    im, d = canvas(); rr(d, (140, 40, 372, 470), 34, (45, 48, 60, 255), (20, 22, 30, 255), 12); rr(d, (165, 85, 347, 230), 14, (110, 235, 150, 255), None)
    for r in range(3):
        for k in range(3): circ(d, 200 + k * 56, 290 + r * 52, 16, (150, 155, 175, 255))
    d.polygon(sparkle4(256, 150, 40), fill=(40, 120, 70, 255)); return im
def idcard():
    im, d = canvas(); rr(d, (40, 120, 472, 392), 28, (240, 245, 255, 255), (110, 130, 180, 255), 12); circ(d, 150, 230, 54, (190, 200, 225, 255)); rr(d, (110, 290, 190, 350), 20, (190, 200, 225, 255))
    for y in (190, 235, 280): rr(d, (250, y, 430, y + 22), 8, (170, 180, 210, 255)); d.polygon(star(410, 340, 24), fill=(255, 205, 70, 255)); return im
def passport():
    im, d = canvas(); rr(d, (110, 40, 402, 470), 24, (45, 70, 150, 255), (20, 35, 90, 255), 12); circ(d, 256, 220, 80, None, (255, 215, 90, 255), 10); line(d, [(256, 140), (256, 300)], (255, 215, 90, 255), 8); line(d, [(176, 220), (336, 220)], (255, 215, 90, 255), 8); rr(d, (170, 360, 342, 392), 8, (255, 215, 90, 255)); return im
def safe(open_=False):
    im, d = canvas(); rr(d, (60, 60, 452, 450), 30, (110, 118, 135, 255), (55, 60, 75, 255), 14); rr(d, (95, 95, 417, 415), 18, (150, 158, 175, 255), (70, 76, 95, 255), 8)
    circ(d, 256, 255, 80, (95, 100, 120, 255), (55, 60, 75, 255), 8); circ(d, 256, 255, 20, (255, 205, 70, 255)); line(d, [(256, 255), (256, 195)], (255, 205, 70, 255), 10)
    if open_: d.polygon([(95, 95), (95, 415), (40, 440), (40, 70)], fill=(80, 86, 105, 255)); return im
    return im
def vault():
    im, d = canvas(); circ(d, 256, 256, 225, (150, 158, 178, 255), (70, 76, 95, 255), 16); circ(d, 256, 256, 160, (120, 128, 148, 255), (70, 76, 95, 255), 10)
    for a in range(0, 360, 60): r = math.radians(a); line(d, [(256 + 40 * math.cos(r), 256 + 40 * math.sin(r)), (256 + 120 * math.cos(r), 256 + 120 * math.sin(r))], (230, 235, 245, 255), 16)
    circ(d, 256, 256, 38, (255, 205, 70, 255), (200, 140, 20, 255), 8); return im
def ledger():
    im, d = canvas(); rr(d, (90, 40, 420, 470), 20, (90, 50, 40, 255), (50, 25, 20, 255), 12); rr(d, (130, 90, 380, 190), 10, (240, 220, 160, 255)); text(d, '$', 256, 140, 80, (110, 60, 30, 255)); 
    for y in (240, 290, 340, 390): line(d, [(140, y), (370, y)], (200, 170, 120, 255), 8); return im
def scales():
    im, d = canvas(); line(d, [(256, 60), (256, 440)], (210, 170, 70, 255), 20); line(d, [(100, 130), (412, 130)], (210, 170, 70, 255), 16)
    for x in (100, 412): line(d, [(x, 130), (x - 60, 290)], (210, 170, 70, 255), 6); line(d, [(x, 130), (x + 60, 290)], (210, 170, 70, 255), 6); d.pieslice((x - 80, 220, x + 80, 360), 0, 180, fill=(255, 205, 70, 255), outline=(200, 140, 20, 255), width=8)
    rr(d, (170, 430, 342, 480), 12, (210, 170, 70, 255)); return im
def treasure_map():
    im, d = canvas(); poly(d, [(50, 90), (180, 60), (330, 100), (462, 70), (440, 440), (320, 470), (180, 430), (60, 460)], (245, 225, 170, 255), (160, 120, 60, 255), 10)
    for i in range(6): line(d, [(110 + i * 55, 380 - (i % 2) * 70), (150 + i * 55, 330 - ((i + 1) % 2) * 70)], (190, 90, 60, 255), 10)
    line(d, [(100, 380), (200, 300), (260, 340), (350, 200)], (190, 60, 50, 255), 8); line(d, [(320, 170), (380, 230)], (190, 30, 30, 255), 18); line(d, [(380, 170), (320, 230)], (190, 30, 30, 255), 18); return im
def envelope():
    im, d = canvas(); rr(d, (40, 120, 472, 400), 20, (245, 240, 220, 255), (170, 150, 110, 255), 12); line(d, [(50, 140), (256, 290), (462, 140)], (170, 150, 110, 255), 10); circ(d, 256, 300, 46, (60, 170, 90, 255), (30, 110, 55, 255), 8); text(d, '$', 256, 302, 64, WHITE); return im
def crypto(c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 215, A(col), dark(col), 18); circ(d, 256, 256, 162, A(lite(col, .2)), dark(col), 8); text(d, 'B', 256, 262, 230, dark(col, .45)); line(d, [(230, 85), (230, 135)], dark(col, .45), 14); line(d, [(290, 85), (290, 135)], dark(col, .45), 14); line(d, [(230, 380), (230, 430)], dark(col, .45), 14); line(d, [(290, 380), (290, 430)], dark(col, .45), 14); return im
def skullcoin():
    im, d = canvas(); circ(d, 256, 256, 215, (60, 62, 78, 255), (255, 205, 70, 255), 18); circ(d, 256, 225, 90, (240, 240, 245, 255)); rr(d, (200, 290, 312, 370), 16, (240, 240, 245, 255)); circ(d, 220, 225, 26, (40, 40, 55, 255)); circ(d, 292, 225, 26, (40, 40, 55, 255)); poly(d, [(256, 255), (240, 290), (272, 290)], (40, 40, 55, 255), None)
    for x in (226, 256, 286): line(d, [(x, 330), (x, 370)], (60, 62, 78, 255), 6); return im
def siren(c1, c2):
    im, d = canvas(); rr(d, (120, 360, 392, 450), 18, (90, 95, 115, 255), (45, 48, 62, 255), 10); d.pieslice((140, 130, 372, 460), 180, 360, fill=A(COL[c1]), outline=dark(COL[c1]), width=10); d.pieslice((140, 130, 372, 460), 180, 270, fill=A(COL[c2]))
    shine(d, 200, 250, 22)
    for a in (-60, -30, 30, 60): r = math.radians(a); line(d, [(256 + 190 * math.sin(r), 200 - 190 * math.cos(r)), (256 + 240 * math.sin(r), 200 - 240 * math.cos(r))], A(COL[c1]), 12); 
    return im
def nocops():
    im, d = canvas(); circ(d, 256, 256, 215, (255, 255, 255, 255), (230, 50, 70, 255), 40); line(d, [(112, 112), (400, 400)], (230, 50, 70, 255), 40); circ(d, 256, 256, 70, (70, 120, 235, 255)); return im
def wanted():
    im, d = canvas(); rr(d, (80, 30, 432, 480), 14, (235, 210, 150, 255), (140, 100, 50, 255), 12); text(d, 'WANTED', 256, 100, 64, (110, 60, 30, 255)); circ(d, 256, 250, 90, (200, 165, 110, 255), (140, 100, 50, 255), 8); text(d, '$$$', 256, 410, 90, (110, 60, 30, 255)); return im
def handshake():
    im, d = canvas(); poly(d, [(40, 190), (200, 150), (330, 260), (250, 360), (60, 300)], (255, 205, 160, 255), (190, 130, 90, 255), 10); poly(d, [(472, 190), (312, 150), (190, 260), (270, 360), (452, 300)], (160, 110, 80, 255), (100, 60, 40, 255), 10)
    for x in (230, 270, 310): line(d, [(x, 300), (x + 20, 340)], (255, 255, 255, 200), 10); return im
def stash():
    im, d = canvas(); poly(d, [(60, 450), (150, 180), (362, 180), (452, 450)], (130, 90, 60, 255), (70, 45, 25, 255), 12); 
    for x, y, c in [(220, 230, 'gold'), (290, 270, 'green'), (180, 320, 'cyan'), (330, 350, 'pink'), (250, 390, 'gold')]: circ(d, x, y, 34, A(COL[c]), dark(COL[c]), 6)
    return im
def alley():
    im, d = canvas(); rr(d, (30, 30, 482, 482), 30, (28, 30, 52, 255), (15, 16, 32, 255), 12); circ(d, 370, 130, 62, (255, 245, 200, 255)); circ(d, 395, 110, 52, (28, 30, 52, 255))
    for x, w, h in [(50, 90, 250), (150, 70, 190), (330, 110, 280)]: d.rectangle((x, 440 - h, x + w, 440), fill=(48, 52, 82, 255))
    for x, y in [(70, 220), (110, 260), (350, 200), (400, 250), (360, 320)]: d.rectangle((x, y, x + 18, y + 24), fill=(255, 220, 110, 255)); return im
def nightowl():
    im, d = canvas(); circ(d, 256, 256, 215, (28, 30, 52, 255), (15, 16, 32, 255), 12); circ(d, 190, 230, 50, (255, 240, 140, 255)); circ(d, 322, 230, 50, (255, 240, 140, 255)); circ(d, 190, 230, 20, INK); circ(d, 322, 230, 20, INK); poly(d, [(256, 270), (230, 330), (282, 330)], (255, 160, 60, 255), None); return im
def contraband():
    im, d = canvas(); rr(d, (150, 60, 362, 470), 40, (45, 130, 75, 255), (20, 70, 40, 255), 12); rr(d, (210, 20, 302, 90), 10, (140, 90, 50, 255), (80, 50, 20, 255), 8); circ(d, 256, 270, 70, (240, 240, 245, 255)); circ(d, 232, 262, 14, INK); circ(d, 280, 262, 14, INK); rr(d, (222, 310, 290, 340), 6, INK); return im
def cashstack(c):
    col = COL[c]; im, d = canvas()
    for i, y in enumerate([390, 320, 250, 180]): rr(d, (60, y, 452, y + 90), 14, A(lite(col, .3) if i % 2 else col), dark(col), 8); rr(d, (210, y, 300, y + 90), 4, (240, 230, 190, 255), dark(col), 4); text(d, '$', 256, y + 46, 54, dark(col, .5))
    return im
def darkbag():
    im, d = canvas(); poly(d, [(190, 70), (322, 70), (290, 170), (222, 170)], (50, 52, 66, 255), (20, 22, 30, 255), 10); ell(d, (80, 150, 432, 470), (50, 52, 66, 255), (20, 22, 30, 255)); rr(d, (200, 150, 312, 185), 10, (255, 205, 70, 255), (200, 140, 20, 255), 6); text(d, '$', 256, 330, 170, (255, 205, 70, 255)); return im
def spyeye():
    im, d = canvas(); ell(d, (30, 140, 482, 380), WHITE, INK, 16); circ(d, 256, 260, 90, (70, 120, 235, 255), INK, 10); circ(d, 256, 260, 42, INK); circ(d, 230, 235, 14, WHITE); return im
def detonate():
    im, d = canvas(); poly(d, star(256, 256, 240, .62, 12), (255, 150, 40, 255), (190, 80, 10, 255), 14); poly(d, star(256, 256, 160, .6, 10), (255, 225, 90, 255), None); text(d, '!', 256, 262, 160, (200, 60, 20, 255)); return im
def build():
    for c in ['black', 'red', 'purple', 'navy', 'white', 'green']: reg(f'mask_bandit_{c}', mask_bandit(c), 'Black Market', '🥷'); reg(f'mask_ski_{c}', mask_ski(c), 'Black Market', '🥷')
    for c in ['black', 'red', 'gold', 'blue', 'pink', 'green']: reg(f'shades_{c}', shades(c), 'Black Market', '😎')
    for c in ['black', 'brown', 'grey', 'red', 'gold', 'navy', 'green', 'purple']: reg(f'briefcase_{c}', briefcase(c), 'Black Market', '💼', ['💼'] if c == 'black' else [])
    for c in ['brown', 'grey', 'green', 'navy', 'black', 'red']: reg(f'crate_{c}', crate(c), 'Black Market', '📦')
    for c in ['brown', 'black', 'white', 'red', 'blue', 'gold']: reg(f'parcel_{c}', parcel(c), 'Black Market', '📦', ['📦'] if c == 'brown' else [])
    for c in ['black', 'navy', 'purple', 'red', 'grey', 'green']: reg(f'hood_{c}', hood(c), 'Black Market', '🥷', ['🥷'] if c == 'black' else [])
    for c in ['green', 'gold', 'blue', 'pink', 'red']: reg(f'cashstack_{c}', cashstack(c), 'Black Market', '💵')
    for c in ['orange', 'gold', 'cyan', 'purple', 'green', 'pink']: reg(f'crypto_{c}', crypto(c), 'Black Market', '🪙')
    for n, fn, fb in [('lockpick', lockpick, '🔧'), ('burner_phone', burner, '📱'), ('forged_id', idcard, '🪪'), ('passport', passport, '🛂'), ('safe', safe, '🔐'), ('vault', vault, '🏦'), ('ledger', ledger, '📒'),
                      ('scales', scales, '⚖️'), ('treasure_map', treasure_map, '🗺️'), ('bribe', envelope, '✉️'), ('skull_coin', skullcoin, '💀'), ('no_cops', nocops, '🚫'), ('wanted', wanted, '📜'),
                      ('handshake_deal', handshake, '🤝'), ('stash', stash, '💰'), ('night_alley', alley, '🌃'), ('night_owl', nightowl, '🦉'), ('contraband', contraband, '☠️'), ('dark_cashbag', darkbag, '💰'),
                      ('spy_eye', spyeye, '👁️'), ('boom', detonate, '💥')]:
        reg(f'bm_{n}', fn(), 'Black Market', fb, [fb] if n in ('handshake_deal', 'boom', 'passport', 'ledger', 'scales') else [])
    reg('bm_safe_open', safe(True), 'Black Market', '🔓'); reg('bm_siren', siren('red', 'blue'), 'Black Market', '🚨', ['🚨']); reg('bm_siren_blue', siren('blue', 'red'), 'Black Market', '🚨')
