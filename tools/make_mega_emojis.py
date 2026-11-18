"""Generates Yuna's mega emoji pack (~1,700 emojis) into assets/emojis and writes src/lib/emoji_manifest.json.

    python3 tools/make_mega_emojis.py            (needs Pillow:  pip install pillow)

Safe to re-run: the original 80 emojis are never touched, and re-running just refreshes the mega pack.
At startup the bot uploads every file in assets/emojis as an application emoji (see src/lib/emojis.js).
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mega import base, love, econ, casino, drinks, market, people, world, misc, anim

t = time.time()
base.init()
for m in (love, econ, casino, drinks, market, people, world, misc, anim):
    before = len(base.REG); m.build(); print(f'{m.__name__.split(".")[-1]:<8} +{len(base.REG) - before}')
man = base.write_all()
cats = {}
for n, v in man.items(): cats[v['c']] = cats.get(v['c'], 0) + 1
print(f'\n{len(man)} emojis ({sum(v["a"] for v in man.values())} animated) written in {time.time() - t:.0f}s')
for c, n in sorted(cats.items(), key=lambda x: -x[1]): print(f'  {c:<14}{n}')
