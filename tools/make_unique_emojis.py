"""Adds Yuna's signature emojis (Garden, Sky, Vault, Whisper, Aura, Mood, Ritual, Duet, Trust) without touching the older packs.
    python3 tools/make_unique_emojis.py     (needs Pillow)
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mega import base, unique

old = json.load(open(base.MANIFEST, encoding='utf8')) if os.path.exists(base.MANIFEST) else {}
base.init()
unique.build()
new = base.write_all()          # writes the new files (and a manifest with only the new ones)...
old.update(new)                 # ...so merge them into the full manifest again
json.dump(old, open(base.MANIFEST, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(new)} new emojis written; manifest now has {len(old)}')
