"""Animated emojis built from the static ones."""
from .base import *
from . import market

def flame(col, i):
    im, d = canvas(); sw = math.sin(2 * math.pi * i / FRAMES); k = 1 + .08 * math.sin(4 * math.pi * i / FRAMES)
    def f(scale, c, dy=0): 
        pts = [(256, 40 + 60 * (1 - scale) - 10 * sw * scale), (360 + 20 * sw, 220), (390, 340 + dy), (330, 450), (256, 480), (182, 450), (122, 340 + dy), (152, 220 - 20 * sw)]
        poly(d, [(256 + (x - 256) * scale * k, 480 - (480 - y) * scale * k + (0 if scale == 1 else 0)) for x, y in pts], c, None)
    f(1, A(col)); f(.7, A(lite(col, .45))); f(.4, (255, 252, 220, 255)); return im

def loading(i, c='hotpink'):
    im, d = canvas(); col = COL[c]
    for k in range(10):
        a = 2 * math.pi * k / 10; strength = ((k - i * 10 / FRAMES) % 10) / 10; r = 28 + 22 * (1 - strength)
        circ(d, 256 + 170 * math.sin(a), 256 - 170 * math.cos(a), r, A(col, int(255 * (1 - strength * .85))))
    return im

def roulette_frames():
    from .casino import wheel
    return [wheel(i * (360 / FRAMES) * 2) for i in range(FRAMES)]

def tumble(c):
    from .casino import die
    return [die(1 + (i // 2) % 6, c).rotate(i * 30, resample=Image.BICUBIC) for i in range(FRAMES)]

def twinkle(c):
    out = []
    for i in range(FRAMES):
        im, d = canvas(); k = .7 + .3 * math.sin(2 * math.pi * i / FRAMES); col = COL[c]
        poly(d, star(256, 266, 225 * k, .46), A(col), dark(col), 14); d.polygon(sparkle4(380, 120, 60 * (1.1 - k + .5), .22), fill=WHITE); out.append(im)
    return out

def siren_flash():
    a, b = market.siren('red', 'blue'), market.siren('blue', 'red'); return [a if (i // 3) % 2 == 0 else b for i in range(FRAMES)]

def build():
    g = lambda n: REG[n]['img']
    A_ = lambda name, frames, cat, fb, rep=(): reg('a_' + name, frames, cat, fb, rep)
    for c in COLORS_16: A_(f'heart_{c}', pulse(g(f'loveg_{c}'), .12), 'Animated', '💖')
    for c in COLORS_10: A_(f'chip_{c}', spin(g(f'chip_{c}')), 'Animated', '🪙')
    for c in ['gold', 'silver', 'pink', 'cyan', 'purple', 'red', 'green', 'brown']: A_(f'coin_{c}', spin(g(f'coin_{c}')), 'Animated', '🪙')
    for c in ['red', 'pink', 'cyan', 'green', 'purple', 'gold', 'blue', 'orange', 'white', 'black']: A_(f'gem_{c}', glint(g(f'gem_{c}')), 'Animated', '💎')
    for c in ['gold', 'pink', 'purple', 'cyan', 'red', 'white']: A_(f'crown_{c}', glint(g(f'crown_{c}')), 'Animated', '👑')
    for c in ['red', 'black', 'white']: A_(f'dice_{c}', tumble(c), 'Animated', '🎲')
    A_('roulette', roulette_frames(), 'Animated', '🎡')
    for c, base_c in [('orange', COL['orange']), ('blue', COL['sky']), ('purple', COL['violet']), ('green', COL['lime']), ('pink', COL['hotpink'])]: A_(f'fire_{c}', [flame(base_c, i) for i in range(FRAMES)], 'Animated', '🔥')
    for c in ['gold', 'pink', 'cyan', 'purple', 'white', 'orange']: A_(f'twinkle_{c}', twinkle(c), 'Animated', '✨')
    A_('siren', siren_flash(), 'Animated', '🚨'); A_('loading', [loading(i) for i in range(FRAMES)], 'Animated', '⏳'); A_('loading_gold', [loading(i, 'gold') for i in range(FRAMES)], 'Animated', '⏳')
    for n, how, fb in [('lips_red', pulse, '💋'), ('kiss_pink', pulse, '💋'), ('chili_red', wiggle, '🌶️'), ('devil_purple', wiggle, '😈'), ('potion_pink', wiggle, '🧪'), ('rose_red', wiggle, '🌹'), ('candle_orange', pulse, '🕯️'),
                       ('champ_pop', float_up, '🍾'), ('cheers', wiggle, '🥂'), ('wine_red', wiggle, '🍷'), ('cocktail_umbrella_pink', wiggle, '🍹'), ('beer_amber', wiggle, '🍺'),
                       ('famtree_green', wiggle, '🌳'), ('famtree_pink', wiggle, '🌳'), ('fam_home', bounce, '🏡'), ('fam_hug', pulse, '🫂'), ('fam_heart_hands', pulse, '🫶'), ('fam_couple', bounce, '👫'), ('fam_family4', bounce, '👨‍👩‍👧‍👦'),
                       ('fam_baby_bottle', wiggle, '🍼'), ('fam_wedding_arch', pulse, '💒'), ('fam_rings_pair', wiggle, '💍'),
                       ('briefcase_black', bounce, '💼'), ('cashbag_green', bounce, '💰'), ('cashstack_green', float_up, '💵'), ('bm_skull_coin', spin, '💀'), ('crypto_orange', spin, '🪙'), ('bm_treasure_map', wiggle, '🗺️'), ('bm_boom', pulse, '💥'), ('bm_night_owl', wiggle, '🦉'), ('bm_stash', bounce, '💰'), ('bm_dark_cashbag', bounce, '💰'),
                       ('face_laugh', wiggle, '😂'), ('face_love', pulse, '😍'), ('face_cry', bounce, '😭'), ('face_angry', wiggle, '😠'), ('face_party', bounce, '🥳'), ('face_money', pulse, '🤑'), ('face_cool', wiggle, '😎'), ('face_sleepy', wiggle, '😴'),
                       ('slot_seven_red', pulse, '7️⃣'), ('slot_jackpot', pulse, '🎰'), ('slot_bell', wiggle, '🔔'), ('slot_cherry', bounce, '🍒'), ('slot_clover', wiggle, '🍀'), ('card_as', wiggle, '🃏'), ('tag_win', pulse, '🎰'), ('tag_jackpot', pulse, '🎰'),
                       ('sun_smile', pulse, '🌞'), ('rainbow', pulse, '🌈'), ('an_cat_orange', wiggle, '🐱'), ('an_dog_brown', wiggle, '🐶'), ('an_bunny_white', bounce, '🐰'), ('an_unicorn', wiggle, '🦄'), ('an_dragon_green', wiggle, '🐲'), ('an_panda', wiggle, '🐼')]:
        A_(n, how(g(n)), 'Animated', fb)
