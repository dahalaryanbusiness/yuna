"""Wine, drinks, party."""
from .base import *

LIQ = dict(red=(190, 30, 70), white=(250, 235, 140), rose=(255, 150, 175), gold=(255, 190, 60), purple=(130, 50, 170), blue=(60, 150, 255), green=(100, 215, 120),
           orange=(255, 140, 40), pink=(255, 110, 170), amber=(205, 120, 30), brown=(110, 60, 30), clear=(215, 240, 250), cyan=(70, 220, 230), yellow=(255, 230, 80), crimson=(150, 15, 45), lime=(170, 230, 70))

def glass_wine(c, shape='wine'):
    im, d = canvas(); col = LIQ[c]; gl = (235, 242, 252, 255); go = (150, 160, 190, 255)
    if shape == 'wine':
        poly(d, [(140, 50), (372, 50), (350, 240), (256, 315), (162, 240)], gl, go); poly(d, [(152, 140), (360, 140), (350, 240), (256, 315), (162, 240)], A(col), dark(col, .6), 6)
        d.rectangle((242, 305, 270, 420), fill=(205, 210, 225, 255)); ell(d, (160, 410, 352, 470), (205, 210, 225, 255), go, 8)
    elif shape == 'flute':
        poly(d, [(185, 40), (327, 40), (305, 330), (256, 372), (207, 330)], gl, go); poly(d, [(192, 110), (320, 110), (305, 330), (256, 372), (207, 330)], A(col), dark(col, .6), 6)
        d.rectangle((244, 365, 268, 440), fill=(205, 210, 225, 255)); ell(d, (170, 432, 342, 480), (205, 210, 225, 255), go, 8)
        for x, y in [(240, 200), (275, 250), (250, 295)]: circ(d, x, y, 9, (255, 255, 255, 200))
    else:  # tumbler
        poly(d, [(110, 90), (402, 90), (370, 450), (142, 450)], gl, go); poly(d, [(122, 190), (390, 190), (370, 450), (142, 450)], A(col), dark(col, .6), 6)
        rr(d, (180, 220, 250, 290), 8, (255, 255, 255, 120)); rr(d, (265, 250, 335, 320), 8, (255, 255, 255, 120))
    shine(d, 185, 110, 22); return im

def martini(c):
    im, d = canvas(); col = LIQ[c]; poly(d, [(60, 70), (452, 70), (256, 300)], (235, 242, 252, 255), (150, 160, 190, 255)); poly(d, [(100, 110), (412, 110), (256, 300)], A(col), dark(col, .6), 6)
    d.rectangle((242, 295, 270, 430), fill=(205, 210, 225, 255)); ell(d, (160, 420, 352, 478), (205, 210, 225, 255), (150, 160, 190, 255), 8); line(d, [(300, 20), (230, 200)], (200, 150, 80, 255), 10); circ(d, 238, 185, 30, (90, 180, 80, 255), (40, 110, 40, 255), 6); return im

def cocktail(c, garnish):
    im, d = canvas(); col = LIQ[c]; poly(d, [(105, 120), (407, 120), (360, 450), (152, 450)], (235, 242, 252, 255), (150, 160, 190, 255)); poly(d, [(118, 190), (394, 190), (360, 450), (152, 450)], A(col), dark(col, .6), 6)
    line(d, [(330, 20), (290, 200)], (255, 120, 170, 255), 18)
    if garnish == 'lime': d.pieslice((350, 70, 470, 190), 180, 360, fill=(110, 210, 90, 255), outline=(40, 120, 40, 255), width=8)
    if garnish == 'orange': circ(d, 410, 120, 56, (255, 160, 50, 255), (200, 100, 10, 255), 8)
    if garnish == 'cherry': circ(d, 410, 100, 34, (220, 30, 60, 255), (140, 10, 35, 255), 6)
    if garnish == 'umbrella': poly(d, [(355, 90), (470, 90), (412, 30)], (255, 90, 160, 255), (180, 30, 100, 255), 6)
    if garnish == 'mint': ell(d, (340, 40, 400, 110), (90, 200, 110, 255), (40, 120, 60, 255), 6); ell(d, (390, 50, 450, 120), (90, 200, 110, 255), (40, 120, 60, 255), 6)
    shine(d, 175, 230, 20); return im

def bottle(c, kind):
    im, d = canvas(); col = LIQ[c]; gl = dark(col, .7)
    if kind == 'wine':
        poly(d, [(222, 30), (290, 30), (290, 200), (350, 290), (350, 470), (162, 470), (162, 290), (222, 200)], gl, dark(col, .4), 10)
        rr(d, (215, 24, 297, 90), 10, (200, 60, 70, 255), (120, 20, 30, 255), 6); rr(d, (172, 330, 340, 440), 12, (250, 240, 215, 255), (200, 180, 140, 255), 6); heart(d, 256, 385, 70, A(col), None)
    elif kind == 'champagne':
        poly(d, [(230, 40), (282, 40), (282, 190), (360, 310), (360, 480), (152, 480), (152, 310), (230, 190)], (40, 90, 60, 255), (20, 50, 35, 255), 10); rr(d, (222, 24, 290, 110), 8, (255, 205, 70, 255), (200, 140, 20, 255), 6)
        rr(d, (165, 340, 347, 450), 10, (255, 250, 235, 255), (210, 190, 140, 255), 6); d.polygon(star(256, 395, 34), fill=A(col))
    elif kind == 'whiskey':
        rr(d, (215, 30, 297, 90), 8, (110, 60, 30, 255), (60, 30, 10, 255), 6); rr(d, (205, 85, 307, 180), 10, A(col), dark(col, .5), 8); rr(d, (130, 170, 382, 480), 34, A(col), dark(col, .5), 12); rr(d, (160, 260, 352, 400), 12, (250, 240, 215, 255), (200, 180, 140, 255), 6)
    else:  # beer
        rr(d, (215, 30, 297, 80), 10, (255, 205, 70, 255), (200, 140, 20, 255), 6); poly(d, [(222, 70), (290, 70), (290, 190), (340, 290), (340, 470), (172, 470), (172, 290), (222, 190)], A(col), dark(col, .5), 10); rr(d, (180, 320, 332, 420), 10, (255, 250, 235, 255), (210, 190, 140, 255), 6)
    shine(d, 205, 270, 18); return im

def beer(c='amber'):
    im, d = canvas(); col = LIQ[c]; rr(d, (80, 110, 350, 470), 30, A(col), dark(col, .5)); rr(d, (110, 150, 150, 440), 10, (255, 255, 255, 110))
    d.arc((300, 180, 470, 400), 270, 90, fill=(220, 230, 245, 255), width=34)
    for x, y, r in [(110, 110, 60), (190, 85, 70), (270, 100, 66), (330, 120, 50)]: circ(d, x, y, r, (255, 255, 255, 255), (230, 230, 240, 255), 4)
    return im

def shot(c):
    im, d = canvas(); col = LIQ[c]; poly(d, [(130, 120), (382, 120), (350, 460), (162, 460)], (235, 242, 252, 255), (150, 160, 190, 255)); poly(d, [(138, 210), (374, 210), (350, 460), (162, 460)], A(col), dark(col, .6), 6); shine(d, 190, 160, 20); return im

def grapes_c(c):
    col = LIQ[c] if c in LIQ else COL[c]; im, d = canvas()
    for x, y in [(190, 170), (256, 170), (322, 170), (222, 235), (290, 235), (256, 300), (256, 365)]: circ(d, x, y, 36, A(col), dark(col, .55), 6); shine(d, x - 10, y - 12, 8)
    poly(d, [(256, 120), (330, 40), (390, 85), (310, 140)], (90, 190, 90, 255), (40, 120, 50, 255), 8); line(d, [(256, 130), (256, 60)], (110, 80, 40, 255), 12); return im

def barrel():
    im, d = canvas(); rr(d, (80, 60, 432, 460), 90, (170, 105, 55, 255), (90, 50, 20, 255), 12)
    for y in (140, 370): rr(d, (84, y, 428, y + 30), 6, (80, 85, 100, 255), (45, 48, 60, 255), 4)
    for x in (180, 256, 332): line(d, [(x, 70), (x, 450)], (110, 65, 30, 255), 6)
    circ(d, 256, 255, 26, (70, 40, 20, 255)); return im

def corkscrew():
    im, d = canvas(); line(d, [(120, 120), (392, 120)], (200, 205, 220, 255), 30)
    pts = [(256 + 22 * (1 if i % 2 else -1), 160 + i * 38) for i in range(8)]; line(d, [(256, 125), (256, 150)], (150, 155, 175, 255), 22); line(d, pts, (160, 165, 190, 255), 18)
    circ(d, 120, 120, 24, (255, 205, 70, 255)); circ(d, 392, 120, 24, (255, 205, 70, 255)); return im

def cork():
    im, d = canvas(); rr(d, (160, 90, 352, 430), 30, (215, 170, 110, 255), (140, 100, 50, 255), 12)
    for x, y in [(210, 160), (300, 220), (230, 300), (310, 350)]: circ(d, x, y, 12, (170, 120, 70, 255)); return im

def cheers():
    im, d = canvas(); 
    for sgn in (-1, 1):
        g, _ = canvas(); gd = ImageDraw.Draw(g)
        poly(gd, [(160, 90), (352, 90), (330, 270), (256, 330), (182, 270)], (235, 242, 252, 255), (150, 160, 190, 255)); poly(gd, [(172, 170), (340, 170), (330, 270), (256, 330), (182, 270)], A(LIQ['red'] if sgn < 0 else LIQ['gold']), None)
        gd.rectangle((244, 320, 268, 430), fill=(205, 210, 225, 255)); g = g.rotate(-sgn * 24, center=(256, 450), resample=Image.BICUBIC).resize((360, 360)); im.alpha_composite(g, (60 if sgn < 0 else 100, 120))
    for x, y in [(256, 90), (200, 60), (312, 60)]: d.polygon(sparkle4(x, y, 34), fill=(255, 235, 130, 255))
    return im

def pop():
    im, d = canvas(); poly(d, [(180, 480), (240, 250), (330, 300)], (40, 90, 60, 255), (20, 50, 35, 255), 10); poly(d, [(236, 250), (275, 150), (340, 175), (318, 280)], (255, 205, 70, 255), (200, 140, 20, 255), 8)
    for x, y, c in [(330, 80, 'pink'), (410, 150, 'cyan'), (260, 50, 'gold'), (430, 60, 'green'), (390, 220, 'purple')]: circ(d, x, y, 18, A(COL[c]))
    for x, y in [(350, 120), (300, 60), (420, 100)]: d.polygon(sparkle4(x, y, 28), fill=WHITE); return im

def build():
    for c in ['red', 'white', 'rose', 'gold', 'purple', 'blue', 'green', 'orange', 'pink', 'amber', 'brown', 'clear', 'cyan', 'yellow', 'crimson', 'lime']:
        reg(f'wine_{c}', glass_wine(c, 'wine'), 'Wine & Drinks', '🍷', ['🍷'] if c == 'red' else [])
        reg(f'flute_{c}', glass_wine(c, 'flute'), 'Wine & Drinks', '🥂', ['🥂'] if c == 'gold' else [])
        reg(f'tumbler_{c}', glass_wine(c, 'tumbler'), 'Wine & Drinks', '🥃', ['🥃'] if c == 'amber' else [])
        reg(f'shot_{c}', shot(c), 'Wine & Drinks', '🥃')
        reg(f'martini_{c}', martini(c), 'Wine & Drinks', '🍸', ['🍸'] if c == 'clear' else [])
    for c in ['red', 'purple', 'gold', 'rose', 'white', 'crimson', 'brown', 'green']: reg(f'winebtl_{c}', bottle(c, 'wine'), 'Wine & Drinks', '🍾')
    for c in ['gold', 'white', 'rose', 'green']: reg(f'champ_{c}', bottle(c, 'champagne'), 'Wine & Drinks', '🍾', ['🍾'] if c == 'gold' else [])
    for c in ['amber', 'brown', 'orange', 'gold', 'clear', 'blue', 'red', 'green']: reg(f'liquor_{c}', bottle(c, 'whiskey'), 'Wine & Drinks', '🥃')
    for c in ['amber', 'gold', 'brown', 'green', 'yellow', 'orange']: reg(f'beerbtl_{c}', bottle(c, 'beer'), 'Wine & Drinks', '🍺')
    for c in ['amber', 'gold', 'brown', 'yellow', 'white', 'red', 'orange', 'lime']: reg(f'beer_{c}', beer(c), 'Wine & Drinks', '🍺', ['🍺'] if c == 'amber' else [])
    for g in ['lime', 'orange', 'cherry', 'umbrella', 'mint']:
        for c in ['blue', 'pink', 'orange', 'green', 'red', 'yellow', 'purple', 'cyan'][:5]: reg(f'cocktail_{g}_{c}', cocktail(c, g), 'Wine & Drinks', '🍹', ['🍹'] if (g, c) == ('umbrella', 'pink') else [])
    for c in ['purple', 'green', 'red', 'white', 'rose', 'blue']: reg(f'grapes_{c}', grapes_c(c), 'Wine & Drinks', '🍇')
    reg('wine_barrel', barrel(), 'Wine & Drinks', '🛢️'); reg('corkscrew', corkscrew(), 'Wine & Drinks', '🍾'); reg('wine_cork', cork(), 'Wine & Drinks', '🍾'); reg('cheers', cheers(), 'Wine & Drinks', '🥂'); reg('champ_pop', pop(), 'Wine & Drinks', '🍾')
