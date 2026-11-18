// Gif engine for every action command (/kiss, /hug, /react baka, ...).
//
// Every action keeps a BIG pool of gifs (target 40+, up to 250) that is filled from ALL providers at once
// (nekos.best, waifu.pics, purrbot, otakugifs), cached on disk, and topped up in the background.
// Replies are instant, a slow or failing API never reaches the user, and plain text is never sent:
// if an action's own pool is small, gifs from closely related actions are mixed in.
const fs = require('node:fs');
const path = require('node:path');
const S = require('../data/gifsearch');

const POOL_MAX = 250; // gifs remembered per action
const TARGET_POOL = 40; // we keep refilling (in rounds) until a pool reaches this size
const MIN_POOL = 12; // refill in the background when a pool gets this small
const MAX_ROUNDS = 4; // rounds of requests per refill
const RETRY_AFTER = 60 * 1000; // after a total failure, wait this long before asking the APIs again

// Which action names each provider really supports (unsupported ones are skipped, no wasted requests).
const NEKOS = new Set([
  'baka', 'bite', 'blush', 'bored', 'cry', 'cuddle', 'dance', 'facepalm', 'feed', 'handhold', 'handshake', 'happy',
  'highfive', 'hug', 'kick', 'kiss', 'laugh', 'lurk', 'nod', 'nom', 'nope', 'pat', 'peck', 'poke', 'pout', 'punch',
  'run', 'shoot', 'shrug', 'slap', 'sleep', 'smile', 'smug', 'stare', 'think', 'thumbsup', 'tickle', 'wave', 'wink',
  'yawn', 'yeet',
]);
const WAIFU = new Set([
  'bully', 'cuddle', 'cry', 'hug', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive',
  'handhold', 'nom', 'bite', 'glomp', 'slap', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe',
]);
const PURR = new Set([
  'angry', 'bite', 'blush', 'comfy', 'cry', 'cuddle', 'dance', 'fluff', 'hug', 'kiss', 'lay', 'lick', 'nom', 'pat',
  'poke', 'pout', 'slap', 'smile', 'tail', 'tickle',
]);
const OTAKU = new Set([
  'airkiss', 'bite', 'bleh', 'blush', 'mad', 'angry', 'celebrate', 'cheers', 'clap', 'confused', 'cool', 'cry', 'cuddle', 'dance',
  'drool', 'facepalm', 'handhold', 'happy', 'headbang', 'hug', 'kiss', 'laugh', 'lick', 'love', 'nervous', 'nom',
  'nosebleed', 'peek', 'pinch', 'poke', 'pout', 'punch', 'run', 'sad', 'scared', 'shrug', 'shy', 'sigh', 'sip', 'slap',
  'sleep', 'slowclap', 'smack', 'smile', 'smug', 'sneeze', 'sorry', 'stare', 'surprised', 'sweat', 'thumbsup', 'tickle',
  'tired', 'wave', 'wink', 'yawn', 'yay',
]);

// Neighbours: mixed in when an action's own pool is still small, so people always get a gif.
const RELATED = {
  kiss: ['peck', 'airkiss'], peck: ['kiss', 'airkiss'], hug: ['cuddle', 'glomp'],
  cuddle: ['hug', 'comfy', 'fluff'], handhold: [], tickle: ['poke'],
  // feed / kick / punch / yeet / bite are NEVER mixed with other actions: a kick must show a kick, feeding must show feeding.
  feed: [], nom: [], bite: [], highfive: ['wave'], handshake: [], yeet: [], punch: [], slap: ['smack'], kick: [],
  smack: ['slap'], bonk: [], bully: [], pout: ['angry', 'mad'], laugh: ['happy'], stare: ['lurk', 'peek'],
  sleep: ['yawn', 'tired'], yawn: ['sleep', 'tired'], tired: ['yawn', 'sleep'], smile: ['happy', 'yay'], happy: ['smile', 'yay'],
  blush: ['shy'], shy: ['blush'], cry: ['sad'], sad: ['cry'], wink: ['smug'], wave: ['highfive'], dance: ['happy', 'headbang'],
  angry: ['mad', 'pout'], mad: ['angry', 'pout'], smug: ['wink'], think: ['confused', 'shrug'], shrug: ['confused', 'think'],
  confused: ['think', 'shrug'], facepalm: ['sigh'], baka: ['facepalm'], thumbsup: ['nod'], nod: ['thumbsup'], yay: ['happy', 'celebrate'],
  clap: ['slowclap'], run: ['scared'], scared: ['nervous', 'sweat'], lurk: ['peek', 'stare'], peek: ['lurk', 'stare'],
};

const CACHE_FILE = (() => {
  try { return path.join(require('../store').info().dir, 'gifcache.json'); } catch { return null; }
})();

const pools = new Map(); // type -> [url]
const refills = new Map(); // type -> in-flight promise
const failedAt = new Map(); // type -> timestamp of the last total failure
let saveTimer = null;

function loadCache() {
  if (!CACHE_FILE) return;
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    for (const [type, urls] of Object.entries(data)) if (Array.isArray(urls)) pools.set(type, urls.slice(-POOL_MAX));
  } catch {}
}
function saveCacheSoon() {
  if (!CACHE_FILE || saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(pools)));
    } catch {}
  }, 5000);
  saveTimer.unref();
}
loadCache();

async function http(url, opts = {}) {
  if (typeof fetch !== 'function') throw new Error('fetch is missing, Node 18 or newer is required');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YunaBot)', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Each provider returns an array of urls for one request. `calls` = how many requests one round makes
// (single-gif APIs are called several times in parallel to get a bigger batch).
const PROVIDERS = [
  { name: 'nekos.best', only: NEKOS, calls: 2, get: async (t) => ((await http(`https://nekos.best/api/v2/${t}?amount=20`)).results || []).map((r) => r.url) },
  { name: 'waifu.pics', only: WAIFU, calls: 1, get: async (t) => (await http(`https://api.waifu.pics/many/sfw/${t}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"exclude":[]}' })).files || [] },
  { name: 'purrbot', only: PURR, calls: 6, get: async (t) => [(await http(`https://api.purrbot.site/v2/img/sfw/${t}/gif`)).link] },
  { name: 'otakugifs', only: OTAKU, calls: 6, get: async (t) => [(await http(`https://api.otakugifs.xyz/gif?reaction=${t}`)).url] },
];

function add(type, urls) {
  const pool = pools.get(type) || [];
  for (const u of urls) if (typeof u === 'string' && /^https?:\/\//.test(u) && !S.BLOCKED.has(u) && !pool.includes(u)) pool.push(u);
  while (pool.length > POOL_MAX) pool.shift();
  pools.set(type, pool);
  saveCacheSoon();
}

// Is this action name known by at least one provider?
const supported = (type) => PROVIDERS.some((p) => p.only.has(type));

// One round = every provider that knows this action is asked at the same time.
async function round(type) {
  const jobs = [];
  for (const p of PROVIDERS) {
    if (!p.only.has(type)) continue;
    for (let i = 0; i < p.calls; i++) {
      jobs.push(
        p.get(type).then(
          (urls) => { add(type, urls); return urls.length; },
          (err) => { console.error(`[gif:${type}] ${p.name}: ${err.message}`); return 0; }
        )
      );
    }
  }
  const got = await Promise.all(jobs);
  return got.reduce((a, b) => a + b, 0);
}

// Fetches more gifs for one action until the pool is big enough. Resolves true if anything was added.
function refill(type, maxRounds = MAX_ROUNDS) {
  if (refills.has(type)) return refills.get(type);
  const job = (async () => {
    let any = false;
    for (let r = 0; r < maxRounds; r++) {
      if ((pools.get(type) || []).length >= TARGET_POOL) break;
      const before = (pools.get(type) || []).length;
      const got = await round(type);
      if (got) any = true;
      if (!got || (pools.get(type) || []).length === before) break; // nothing new, stop asking
    }
    if (any || (pools.get(type) || []).length) failedAt.delete(type);
    else failedAt.set(type, Date.now());
    return any;
  })().finally(() => refills.delete(type));
  refills.set(type, job);
  return job;
}

function candidates(type) {
  let list = pools.get(type) || [];
  if (list.length < MIN_POOL) {
    for (const r of RELATED[type] || []) list = list.concat(pools.get(r) || []);
  }
  return list;
}

async function getAnyGif(type) {
  const cooling = Date.now() - (failedAt.get(type) || 0) < RETRY_AFTER;
  const own = (pools.get(type) || []).length;
  if (own < MIN_POOL && !cooling && supported(type)) {
    if (!own) await refill(type); // nothing at all yet: wait for the first batch
    else refill(type).catch(() => {}); // some gifs ready: top up in the background
  } else if (own < POOL_MAX && Math.random() < 0.1) {
    refill(type).catch(() => {}); // keep pools fresh
  }
  let list = candidates(type);
  if (!list.length) {
    // Completely empty: borrow from neighbours, fetching them if needed.
    for (const r of RELATED[type] || []) {
      if (!(pools.get(r) || []).length) await refill(r);
      list = list.concat(pools.get(r) || []);
      if (list.length) break;
    }
  }
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}


// ---------------------------------------------------------------------------------------------------------------
// Pair-aware gifs (boy+boy = mm, girl+girl = ff, boy+girl = mf). Uses Tenor / Giphy SEARCH, because nekos.best and the
// other free APIs return random gifs and cannot be filtered by gender or by who is in the gif.
// ---------------------------------------------------------------------------------------------------------------
const MIN_PAIR = 10; // refill a pair pool in the background below this size
const PAIR_TARGET = 60;
const tenorKey = () => process.env.TENOR_API_KEY || '';
const giphyKey = () => process.env.GIPHY_API_KEY || '';
const searchEnabled = () => Boolean(tenorKey() || giphyKey());
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const pk = (type, pair) => `${type}:${pair}`;

async function tenorSearch(q) {
  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${encodeURIComponent(tenorKey())}` +
    '&client_key=yuna&limit=50&random=true&contentfilter=high&media_filter=mediumgif,gif';
  const data = await http(url);
  return (data.results || []).map((r) => ({
    url: (r.media_formats?.mediumgif || r.media_formats?.gif || {}).url,
    text: `${r.content_description || ''} ${(r.tags || []).join(' ')}`,
  }));
}
async function giphySearch(q) {
  const offset = Math.floor(Math.random() * 120);
  const url = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey())}&q=${encodeURIComponent(q)}` +
    `&limit=50&offset=${offset}&rating=pg&lang=en`;
  const data = await http(url);
  return (data.data || []).map((r) => ({
    url: (r.images?.downsized_large || r.images?.downsized || r.images?.original || {}).url,
    text: `${r.title || ''} ${r.slug || ''} ${(r.tags || []).join(' ')}`,
  }));
}

const pairFailed = new Map();
const pairRefills = new Map();

// Asks Tenor/Giphy for this action + pairing and keeps only gifs whose title/tags fit the action.
function refillPair(type, pair) {
  const key = pk(type, pair);
  if (pairRefills.has(key)) return pairRefills.get(key);
  const cfg = S.ACTIONS[type];
  const job = (async () => {
    if (!cfg || !searchEnabled()) return false;
    let any = false;
    for (let i = 0; i < 3; i++) {
      if ((pools.get(key) || []).length >= PAIR_TARGET) break;
      const q = `${rnd(S.PAIR_WORDS[pair])} ${rnd(cfg.phrases)}`;
      const calls = [];
      if (tenorKey()) calls.push(tenorSearch(q));
      if (giphyKey()) calls.push(giphySearch(q));
      const results = await Promise.allSettled(calls);
      for (const r of results) {
        if (r.status === 'rejected') { console.error(`[gif:${key}] search: ${r.reason?.message}`); continue; }
        const urls = r.value
          .filter((g) => g.url && (!cfg.must || cfg.must.test(g.text)) && (!cfg.ban || !cfg.ban.test(g.text)))
          .map((g) => g.url);
        if (urls.length) { add(key, urls); any = true; }
      }
    }
    if (any || (pools.get(key) || []).length) pairFailed.delete(key);
    else pairFailed.set(key, Date.now());
    return any;
  })().finally(() => pairRefills.delete(key));
  pairRefills.set(key, job);
  return job;
}

async function getPairGif(type, pair) {
  const key = pk(type, pair);
  const cooling = Date.now() - (pairFailed.get(key) || 0) < RETRY_AFTER;
  const own = pools.get(key) || [];
  if (own.length < MIN_PAIR && !cooling && searchEnabled()) {
    if (!own.length && !(S.CURATED[type]?.[pair] || []).length) await refillPair(type, pair);
    else refillPair(type, pair).catch(() => {});
  } else if (own.length < POOL_MAX && Math.random() < 0.1) {
    refillPair(type, pair).catch(() => {});
  }
  const list = (pools.get(key) || []).concat(S.CURATED[type]?.[pair] || []);
  return list.length ? rnd(list) : null;
}

// pair: 'mm' | 'ff' | 'mf' when both people set /gender boy|girl. Otherwise (unknown) the three pairings are
// picked with EQUAL chance, so no pairing is favoured. If nothing is available the old random pool is used.
async function getGif(type, opts = {}) {
  if (S.PAIRABLE.has(type)) {
    const order = opts.pair && S.PAIRS.includes(opts.pair) ? [opts.pair, 'any'] : shuffle(S.PAIRS);
    for (const p of order) {
      if (p === 'any') break;
      const url = await getPairGif(type, p);
      if (url) return url;
    }
    const curated = S.CURATED[type]?.any || [];
    if (curated.length && Math.random() < 0.5) return rnd(curated);
  }
  return getAnyGif(type);
}

// Fills the pools at startup so the very first command already has gifs. Pass 1 is quick (one round per
// action, so everything works within a minute), pass 2 slowly grows every pool to its target size.
async function warm(types) {
  const list = [...new Set(types)];
  for (const t of list) {
    await refill(t, 1).catch(() => {});
    await new Promise((r) => setTimeout(r, 250));
  }
  for (const t of list) {
    await refill(t).catch(() => {});
    await new Promise((r) => setTimeout(r, 700));
  }
  if (searchEnabled()) {
    for (const t of list.filter((x) => S.PAIRABLE.has(x))) {
      for (const p of S.PAIRS) {
        await refillPair(t, p).catch(() => {});
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
}

const stats = () => Object.fromEntries([...pools].map(([k, v]) => [k, v.length]));

module.exports = { getGif, warm, supported, stats, searchEnabled };
