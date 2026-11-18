"""Letters, numbers, food, nature, zodiac, UI."""
from .base import *

def letter_p(ch, c='hotpink'):
    col = COL[c]; im, d = canvas(); rr(d, (30, 30, 482, 482), 110, A(col), dark(col), 16); rr(d, (55, 55, 457, 300), 90, A(lite(col, .2)), None); text(d, ch, 256, 262, 300, WHITE, 8, dark(col, .55)); return im
def letter_g(ch):
    im, d = canvas(); text(d, ch, 256, 262, 440, (255, 205, 70, 255), 16, (160, 100, 10, 255)); text(d, ch, 256, 250, 440, (255, 232, 130, 255), 0); return im

def pizza():
    im, d = canvas(); poly(d, [(256, 480), (50, 120), (462, 120)], (255, 205, 90, 255), (200, 140, 40, 255), 12); rr(d, (40, 70, 472, 140), 30, (225, 160, 80, 255), (160, 100, 40, 255), 10)
    for x, y in [(256, 190), (200, 250), (312, 250), (256, 320)]: circ(d, x, y, 30, (220, 60, 70, 255), (150, 20, 40, 255), 6); return im
def burger():
    im, d = canvas(); d.pieslice((50, 60, 462, 330), 180, 360, fill=(230, 160, 80, 255), outline=(160, 100, 40, 255), width=12); rr(d, (50, 200, 462, 260), 20, (90, 190, 90, 255)); rr(d, (50, 250, 462, 320), 30, (130, 70, 40, 255)); rr(d, (50, 310, 462, 360), 12, (255, 205, 70, 255)); rr(d, (50, 350, 462, 440), 40, (230, 160, 80, 255), (160, 100, 40, 255), 10); return im
def fries():
    im, d = canvas()
    for i, x in enumerate(range(130, 400, 40)): rr(d, (x, 60 + (i % 3) * 25, x + 34, 300), 6, (255, 215, 90, 255), (200, 150, 30, 255), 5)
    poly(d, [(100, 260), (412, 260), (380, 470), (132, 470)], (235, 60, 80, 255), (150, 20, 40, 255), 10); text(d, 'F', 256, 370, 130, WHITE); return im
def donut(c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 220, (225, 160, 80, 255), (160, 100, 40, 255), 12); circ(d, 256, 250, 200, A(col), dark(col), 8); circ(d, 256, 256, 62, T, (160, 100, 40, 255), 10); d.ellipse((196, 196, 316, 316), fill=T)
    for x, y, cc in [(130, 200, 'white'), (360, 170, 'yellow'), (400, 310, 'cyan'), (170, 360, 'lime'), (300, 410, 'white'), (110, 290, 'gold')]: line(d, [(x, y), (x + 26, y + 14)], A(COL[cc]), 12)
    return im
def icecream(c):
    col = COL[c]; im, d = canvas(); poly(d, [(130, 250), (382, 250), (256, 490)], (235, 180, 100, 255), (170, 110, 40, 255), 10); circ(d, 256, 190, 130, A(col), dark(col), 10); circ(d, 256, 100, 70, A(lite(col, .2)), dark(col), 8); circ(d, 256, 40, 22, (225, 40, 70, 255)); shine(d, 200, 180, 26); return im
def cupcake(c):
    col = COL[c]; im, d = canvas(); poly(d, [(110, 280), (402, 280), (360, 470), (152, 470)], (230, 160, 100, 255), (170, 100, 50, 255), 10); 
    for x in (190, 256, 322): line(d, [(x, 290), (x - 10, 460)], (190, 120, 70, 255), 6)
    circ(d, 256, 250, 140, A(col), dark(col), 10); circ(d, 256, 140, 80, A(lite(col, .2)), dark(col), 8); circ(d, 256, 70, 26, (225, 40, 70, 255)); return im
def candy(c):
    col = COL[c]; im, d = canvas(); poly(d, [(40, 150), (150, 230), (150, 290), (40, 370)], A(lite(col, .3)), dark(col), 8); poly(d, [(472, 150), (362, 230), (362, 290), (472, 370)], A(lite(col, .3)), dark(col), 8); circ(d, 256, 256, 125, A(col), dark(col), 10)
    for a in (-40, 0, 40): line(d, [(180, 256 + a), (330, 256 + a - 30)], WHITE, 12); return im
def lolly(c):
    col = COL[c]; im, d = canvas(); line(d, [(256, 300), (256, 490)], (240, 235, 225, 255), 22); circ(d, 256, 200, 170, A(col), dark(col), 12); d.arc((136, 80, 376, 320), 0, 270, fill=WHITE, width=18); d.arc((186, 130, 326, 270), 90, 360, fill=WHITE, width=18); return im
def coffee():
    im, d = canvas(); rr(d, (80, 140, 380, 440), 50, (255, 250, 245, 255), (190, 160, 140, 255), 12); d.arc((330, 190, 470, 340), 270, 90, fill=(190, 160, 140, 255), width=30); ell(d, (95, 150, 365, 230), (110, 65, 40, 255)); heart(d, 230, 190, 80, (255, 235, 210, 255), None)
    for x in (160, 230, 300): line(d, [(x, 120), (x + 14, 80), (x, 40)], (200, 200, 215, 255), 12); return im
def boba(c):
    col = COL[c]; im, d = canvas(); poly(d, [(120, 120), (392, 120), (350, 470), (162, 470)], (250, 252, 255, 230), (170, 180, 210, 255), 10); poly(d, [(130, 190), (382, 190), (350, 470), (162, 470)], A(col), None); rr(d, (110, 90, 402, 130), 14, (230, 235, 245, 255), (170, 180, 210, 255), 8); line(d, [(300, 100), (340, 10)], (255, 120, 170, 255), 22)
    for x, y in [(200, 420), (250, 440), (300, 420), (225, 390), (275, 395)]: circ(d, x, y, 20, (50, 35, 40, 255)); return im
def sushi():
    im, d = canvas(); rr(d, (80, 250, 432, 440), 50, (255, 255, 255, 255), (200, 200, 215, 255), 10); rr(d, (60, 170, 452, 300), 50, (255, 130, 110, 255), (190, 70, 60, 255), 10)
    for x in (140, 210, 280, 350): line(d, [(x, 190), (x + 30, 280)], (255, 190, 170, 255), 10); return im
def strawberry():
    im, d = canvas(); poly(d, [(256, 480), (80, 210), (130, 130), (382, 130), (432, 210)], (235, 50, 80, 255), (150, 20, 45, 255), 12); poly(d, [(256, 150), (180, 60), (256, 100), (332, 60)], (90, 190, 90, 255), (40, 120, 50, 255), 8)
    for x, y in [(190, 220), (256, 260), (322, 220), (220, 330), (292, 330), (256, 400)]: ell(d, (x - 8, y - 12, x + 8, y + 12), (255, 235, 150, 255)); return im
def popcorn():
    im, d = canvas(); 
    for x, y in [(150, 130), (256, 90), (362, 130), (200, 190), (312, 190)]: circ(d, x, y, 64, (255, 250, 235, 255), (230, 200, 130, 255), 8)
    poly(d, [(100, 230), (412, 230), (370, 480), (142, 480)], (235, 60, 80, 255), (150, 20, 40, 255), 10)
    for x in (180, 256, 332): d.polygon([(x - 20, 235), (x + 20, 235), (x + 24, 475), (x - 24, 475)], fill=WHITE); return im
def apple(c):
    col = COL[c]; im, d = canvas(); circ(d, 190, 290, 150, A(col), dark(col), 12); circ(d, 322, 290, 150, A(col), dark(col), 12); rr(d, (100, 200, 410, 400), 60, A(col), None); line(d, [(256, 160), (270, 70)], (110, 70, 40, 255), 18); poly(d, [(280, 100), (390, 50), (370, 150)], (90, 190, 90, 255), (40, 120, 50, 255), 8); shine(d, 150, 230, 30); return im

def sun():
    im, d = canvas()
    for a in range(0, 360, 30): r = math.radians(a); line(d, [(256 + 170 * math.cos(r), 256 + 170 * math.sin(r)), (256 + 235 * math.cos(r), 256 + 235 * math.sin(r))], (255, 190, 50, 255), 24)
    circ(d, 256, 256, 150, (255, 215, 70, 255), (230, 150, 20, 255), 14); circ(d, 215, 240, 14, INK); circ(d, 297, 240, 14, INK); d.arc((205, 255, 307, 330), 20, 160, fill=INK, width=10); return im
def moon(phase):
    im, d = canvas(); circ(d, 256, 256, 215, (255, 235, 150, 255), (210, 170, 60, 255), 14)
    cover = Image.new('RGBA', (S, S), T); cd = ImageDraw.Draw(cover); dk_ = (45, 50, 90, 255)
    if phase == 0: cd.ellipse((41, 41, 471, 471), fill=dk_)
    elif phase == 1: cd.ellipse((41, 41, 471, 471), fill=dk_); cd.ellipse((130, 41, 560, 471), fill=T)
    elif phase == 2: cd.rectangle((0, 0, 256, 512), fill=dk_)
    elif phase == 3: cd.rectangle((0, 0, 256, 512), fill=dk_); cd.ellipse((130, 41, 380, 471), fill=(255, 235, 150, 255))
    elif phase == 5: cd.rectangle((256, 0, 512, 512), fill=dk_); cd.ellipse((130, 41, 380, 471), fill=(255, 235, 150, 255))
    elif phase == 6: cd.rectangle((256, 0, 512, 512), fill=dk_)
    elif phase == 7: cd.ellipse((41, 41, 471, 471), fill=dk_); cd.ellipse((-48, 41, 382, 471), fill=T)
    if phase != 4:
        m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).ellipse((41, 41, 471, 471), fill=255); cover.putalpha(Image.composite(cover.getchannel('A'), Image.new('L', (S, S), 0), m)); im.alpha_composite(cover)
    return im
def cloud(c=(240, 245, 255), rain=0, snow=0, bolt=0):
    im, d = canvas(); col = A(c); o = (170, 185, 215, 255)
    for x, y, r in [(150, 220, 90), (256, 170, 110), (370, 225, 85), (256, 260, 100)]: circ(d, x, y, r, col, o, 8)
    for x, y, r in [(150, 220, 82), (256, 170, 102), (370, 225, 77), (256, 260, 92)]: circ(d, x, y, r, col)
    if rain:
        for x in (150, 230, 310, 390): line(d, [(x, 360), (x - 25, 450)], (90, 160, 255, 255), 18)
    if snow:
        for x, y in [(170, 400), (256, 440), (340, 400)]: d.polygon(star(x, y, 34, .3, 6), fill=(180, 215, 255, 255))
    if bolt: poly(d, [(290, 330), (200, 440), (255, 440), (220, 505), (330, 390), (270, 390)], (255, 220, 60, 255), (200, 140, 10, 255), 6)
    return im
def rainbow():
    im, d = canvas()
    for i, c in enumerate(['red', 'orange', 'yellow', 'green', 'sky', 'purple']): r = 235 - i * 32; d.arc((256 - r, 280 - r, 256 + r, 280 + r), 180, 360, fill=A(COL[c]), width=36)
    for x in (110, 400): ell(d, (x - 70, 340, x + 70, 420), (255, 255, 255, 255), (210, 220, 240, 255), 8); return im
def flower(c):
    col = COL[c]; im, d = canvas()
    for i in range(6): a = math.radians(60 * i); circ(d, 256 + 120 * math.sin(a), 256 - 120 * math.cos(a), 86, A(col), dark(col), 9)
    circ(d, 256, 256, 70, (255, 215, 80, 255), (220, 150, 20, 255), 8); shine(d, 235, 235, 14); return im
def tulip(c):
    col = COL[c]; im, d = canvas(); line(d, [(256, 280), (256, 490)], (70, 170, 85, 255), 24); poly(d, [(256, 490), (180, 330), (256, 400)], (90, 195, 105, 255), (40, 120, 60, 255), 6)
    poly(d, [(110, 80), (160, 220), (256, 300), (352, 220), (402, 80), (330, 150), (256, 40), (182, 150)], A(col), dark(col), 10); return im
def sunflower():
    im, d = canvas()
    for i in range(14): a = math.radians(360 / 14 * i); circ(d, 256 + 165 * math.sin(a), 256 - 165 * math.cos(a), 52, (255, 205, 60, 255), (220, 150, 20, 255), 6)
    circ(d, 256, 256, 105, (130, 80, 40, 255), (80, 45, 20, 255), 8); return im
def mushroom(c):
    col = COL[c]; im, d = canvas(); rr(d, (190, 260, 322, 470), 40, (250, 240, 225, 255), (200, 180, 150, 255), 10); d.pieslice((40, 60, 472, 440), 180, 360, fill=A(col), outline=dark(col), width=12)
    for x, y, r in [(150, 190, 30), (256, 130, 36), (360, 190, 30), (256, 220, 24)]: circ(d, x, y, r, WHITE); return im
def planet(c, ring=True):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 160, A(col), dark(col), 12); d.arc((110, 190, 402, 330), 190, 350, fill=(255, 235, 170, 255), width=22)
    if ring: d.arc((20, 200, 492, 320), 0, 360, fill=(255, 235, 170, 230), width=16)
    shine(d, 205, 190, 30); return im
def zodiac(g, c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 225, A(col), dark(col), 14); circ(d, 256, 256, 180, A(lite(col, .22)), None); text(d, g, 256, 262, 250, WHITE, 6, dark(col, .55)); return im

def arrow_c(dirn, c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 225, A(col), dark(col), 14); a = {'up': 0, 'right': 90, 'down': 180, 'left': 270}[dirn]
    pts = [(256, 100), (370, 240), (295, 240), (295, 400), (217, 400), (217, 240), (142, 240)]; layer = Image.new('RGBA', (S, S), T); ld = ImageDraw.Draw(layer); ld.polygon(pts, fill=WHITE); im.alpha_composite(layer.rotate(-a, resample=Image.BICUBIC)); return im
def sym(g, c, size=300):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 225, A(col), dark(col), 14); circ(d, 256, 256, 180, A(lite(col, .2)), None); text(d, g, 256, 262, size, WHITE, 6, dark(col, .55)); return im
def play_c(kind, c):
    col = COL[c]; im, d = canvas(); circ(d, 256, 256, 225, A(col), dark(col), 14)
    if kind == 'play': d.polygon([(200, 140), (200, 372), (390, 256)], fill=WHITE)
    elif kind == 'pause': rr(d, (160, 140, 225, 372), 12, WHITE); rr(d, (287, 140, 352, 372), 12, WHITE)
    elif kind == 'stop': rr(d, (155, 155, 357, 357), 24, WHITE)
    elif kind == 'plus': rr(d, (225, 130, 287, 382), 14, WHITE); rr(d, (130, 225, 382, 287), 14, WHITE)
    elif kind == 'minus': rr(d, (130, 225, 382, 287), 14, WHITE)
    elif kind == 'check': line(d, [(140, 270), (224, 355), (380, 170)], WHITE, 50)
    elif kind == 'cross': line(d, [(165, 165), (347, 347)], WHITE, 46); line(d, [(347, 165), (165, 347)], WHITE, 46)
    elif kind == 'refresh': d.arc((130, 130, 382, 382), 40, 320, fill=WHITE, width=40); d.polygon([(330, 100), (400, 190), (290, 200)], fill=WHITE)
    elif kind == 'search': circ(d, 235, 235, 84, None, WHITE, 36); line(d, [(300, 300), (390, 390)], WHITE, 42)
    elif kind == 'bell': poly(d, [(256, 110), (180, 190), (170, 300), (130, 340), (382, 340), (342, 300), (332, 190)], WHITE, None); circ(d, 256, 372, 24, WHITE)
    elif kind == 'gear':
        for i in range(8): a = math.radians(45 * i); line(d, [(256 + 100 * math.cos(a), 256 + 100 * math.sin(a)), (256 + 150 * math.cos(a), 256 + 150 * math.sin(a))], WHITE, 44)
        circ(d, 256, 256, 110, WHITE); circ(d, 256, 256, 50, A(col))
    elif kind == 'home': poly(d, [(256, 120), (130, 250), (382, 250)], WHITE, None); rr(d, (170, 240, 342, 380), 8, WHITE); rr(d, (230, 300, 282, 380), 6, A(col))
    elif kind == 'mail': rr(d, (120, 170, 392, 342), 16, WHITE); line(d, [(130, 185), (256, 280), (382, 185)], A(col), 14)
    elif kind == 'cal': rr(d, (125, 140, 387, 385), 20, WHITE); rr(d, (125, 140, 387, 210), 20, A(dark(col, .8))); line(d, [(190, 120), (190, 165)], WHITE, 16); line(d, [(322, 120), (322, 165)], WHITE, 16)
    elif kind == 'heart': heart(d, 256, 265, 260, WHITE, None)
    elif kind == 'star': d.polygon(star(256, 270, 150), fill=WHITE)
    elif kind == 'q': text(d, '?', 256, 262, 300, WHITE)
    elif kind == 'ex': text(d, '!', 256, 262, 300, WHITE)
    return im
def clock_n(h):
    im, d = canvas(); circ(d, 256, 256, 225, (255, 250, 250, 255), (200, 110, 150, 255), 18)
    for k in range(12): a = math.radians(30 * k); line(d, [(256 + 175 * math.sin(a), 256 - 175 * math.cos(a)), (256 + 200 * math.sin(a), 256 - 200 * math.cos(a))], (200, 110, 150, 255), 10)
    ha = math.radians(30 * h); line(d, [(256, 256), (256 + 105 * math.sin(ha), 256 - 105 * math.cos(ha))], (70, 50, 90, 255), 20); line(d, [(256, 256), (256, 110)], (255, 90, 130, 255), 14); circ(d, 256, 256, 16, (70, 50, 90, 255)); return im
def bar_piece(kind, full, c):
    col = COL[c]; im, d = canvas(); f = A(col) if full else (200, 205, 220, 255); o = dark(col) if full else (140, 145, 165, 255)
    if kind == 'l': rr(d, (60, 150, 520, 362), 106, f, o, 14)
    elif kind == 'm': d.rectangle((-10, 150, 522, 362), fill=f); line(d, [(-10, 152), (522, 152)], o, 14); line(d, [(-10, 360), (522, 360)], o, 14)
    else: rr(d, (-8, 150, 452, 362), 106, f, o, 14)
    return im

ZOD = [('♈', 'Aries', 'red'), ('♉', 'Taurus', 'green'), ('♊', 'Gemini', 'yellow'), ('♋', 'Cancer', 'cyan'), ('♌', 'Leo', 'orange'), ('♍', 'Virgo', 'lime'), ('♎', 'Libra', 'pink'), ('♏', 'Scorpio', 'crimson'), ('♐', 'Sagittarius', 'purple'), ('♑', 'Capricorn', 'brown'), ('♒', 'Aquarius', 'blue'), ('♓', 'Pisces', 'teal')]

def build():
    for ch in 'abcdefghijklmnopqrstuvwxyz':
        reg(f'ltr_p_{ch}', letter_p(ch.upper()), 'Letters', '🔤', ['🅰️'] if ch == 'a' else ['🅱️'] if ch == 'b' else [])
        reg(f'ltr_g_{ch}', letter_g(ch.upper()), 'Letters', '🔤')
    for n in range(10): reg(f'num_p_{n}', letter_p(str(n), 'purple'), 'Letters', '🔢'); reg(f'num_g_{n}', letter_g(str(n)), 'Letters', '🔢')
    for n, fn, fb in [('pizza', pizza, '🍕'), ('burger', burger, '🍔'), ('fries', fries, '🍟'), ('coffee', coffee, '☕'), ('sushi', sushi, '🍣'), ('strawberry', strawberry, '🍓'), ('popcorn', popcorn, '🍿')]: reg(f'food_{n}', fn(), 'Food', fb, ['☕'] if n == 'coffee' else [])
    for c in ['pink', 'brown', 'cyan', 'yellow', 'purple']: reg(f'donut_{c}', donut(c), 'Food', '🍩')
    for c in ['pink', 'white', 'brown', 'mint', 'yellow', 'purple']: reg(f'icecream_{c}', icecream(c), 'Food', '🍦')
    for c in ['pink', 'white', 'cyan', 'purple', 'yellow']: reg(f'cupcake_{c}', cupcake(c), 'Food', '🧁')
    for c in ['pink', 'cyan', 'yellow', 'green', 'purple']: reg(f'candy_{c}', candy(c), 'Food', '🍬'); reg(f'lolly_{c}', lolly(c), 'Food', '🍭')
    for c in ['pink', 'brown', 'green', 'purple']: reg(f'boba_{c}', boba(c), 'Food', '🧋')
    for c in ['red', 'green', 'yellow']: reg(f'apple_{c}', apple(c), 'Food', '🍎')
    reg('sun_smile', sun(), 'Nature', '🌞', ['🌞'])
    for i in range(8): reg(f'moon_{i}', moon(i), 'Nature', '🌙')
    reg('cloud', cloud(), 'Nature', '☁️'); reg('cloud_rain', cloud((200, 215, 240), rain=1), 'Nature', '🌧️'); reg('cloud_snow', cloud((225, 235, 250), snow=1), 'Nature', '❄️'); reg('cloud_storm', cloud((170, 180, 205), bolt=1), 'Nature', '⛈️'); reg('rainbow', rainbow(), 'Nature', '🌈')
    for c in COLORS_ALL[:16]: reg(f'flower_{c}', flower(c), 'Nature', '🌸')
    for c in ['red', 'pink', 'yellow', 'orange', 'purple', 'white']: reg(f'tulip_{c}', tulip(c), 'Nature', '🌷')
    reg('sunflower', sunflower(), 'Nature', '🌻'); 
    for c in ['red', 'purple', 'pink', 'blue']: reg(f'mushroom_{c}', mushroom(c), 'Nature', '🍄')
    for c in ['orange', 'blue', 'pink', 'purple', 'teal']: reg(f'planet_{c}', planet(c), 'Nature', '🪐')
    for g, n, c in ZOD: reg(f'zodiac_{n.lower()}', zodiac(g, c), 'Zodiac', g, [g])
    for dn in ('up', 'down', 'left', 'right'):
        for c in ('hotpink', 'gold', 'blue'): reg(f'arrow_{dn}_{c}', arrow_c(dn, c), 'UI', '➡️', ['⬆️'] if (dn, c) == ('up', 'hotpink') else ['⬇️'] if (dn, c) == ('down', 'hotpink') else [])
    for k, fb in [('play', '▶️'), ('pause', '⏸️'), ('stop', '⏹️'), ('plus', '➕'), ('minus', '➖'), ('check', '✅'), ('cross', '❌'), ('refresh', '🔁'), ('search', '🔍'), ('bell', '🔔'), ('gear', '⚙️'), ('home', '🏠'), ('mail', '📧'), ('cal', '📅'), ('heart', '💖'), ('star', '⭐'), ('q', '❓'), ('ex', '❗')]:
        for c in ('hotpink', 'blue', 'green', 'purple'): reg(f'ui_{k}_{c}', play_c(k, c), 'UI', fb, ['🔁'] if (k, c) == ('refresh', 'hotpink') else [])
    for h in range(1, 13): reg(f'clock_{h}', clock_n(h), 'UI', '🕐', [])
    for c in ('hotpink', 'green', 'gold', 'blue'):
        for k in 'lmr':
            for full in (0, 1): reg(f'bar_{k}{"f" if full else "e"}_{c}', bar_piece(k, full, c), 'Progress', '▬')
