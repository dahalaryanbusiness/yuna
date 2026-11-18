// Smoke test: runs many text commands through the real prefix pipeline with a fake Discord message and reports
// crashes, plain-text replies and over-long embeds. Run with:  node tools/smoke.js   (no token or network needed)
process.env.DATA_DIR = require('node:os').tmpdir() + '/yuna-smoke-' + process.pid;
process.env.EMOJI_SYNC = 'off';
const { Collection } = require('discord.js');
const { loadCommands } = require('../src/loadCommands');
const prefix = require('../src/lib/prefix');
const store = require('../src/store');

const client = { user: { id: '999000000000000001' }, commands: new Collection(), users: { cache: new Map(), fetch: async () => null }, guilds: { cache: new Map() } };
for (const c of loadCommands()) client.commands.set(c.data.name, c);

const mkUser = (id, name) => ({ id, bot: false, username: name, displayName: name, tag: name, toString: () => `<@${id}>`, displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png', send: async () => ({}) });
const ME = mkUser('100000000000000001', 'Tester');
const YOU = mkUser('100000000000000002', 'Partner');
client.users.cache.set(ME.id, ME); client.users.cache.set(YOU.id, YOU);

const u = store.user(ME.id); u.lp = 500000; u.bank = 20000; store.user(YOU.id).lp = 5000;

let failures = 0; const raw = []; const report = [];
async function run(text) {
  const out = [];
  const channel = { id: 'c1', name: 'test', send: async (p) => { out.push(p); return { id: 'm' + out.length, channelId: 'c1', edit: async (q) => { out.push(q); }, delete: async () => {} }; }, sendTyping: async () => {} };
  const mentions = new Map(); for (const m of text.matchAll(/<@!?(\d+)>/g)) if (client.users.cache.get(m[1])) mentions.set(m[1], client.users.cache.get(m[1]));
  const message = {
    id: String(Date.now()), content: text, author: ME, member: { permissions: { has: () => true } }, guild: { id: 'g1', name: 'G' }, guildId: 'g1', channelId: 'c1', channel,
    mentions: { users: mentions, repliedUser: null }, reference: null, attachments: { size: 0 }, stickers: { size: 0 }, embeds: [], system: false, webhookId: null,
    reply: async (p) => { out.push(p); return {}; }, fetchReference: async () => null,
  };
  const origErr = console.error; let threw = null;
  console.error = (...a) => { const t = a.map(String).join(' '); if (!/^\[gif|fetch failed|Could not send/.test(t)) threw = t; };
  try { await prefix.handleMessage(client, message); } catch (e) { threw = e.stack; }
  console.error = origErr;
  const plain = out.filter((p) => (typeof p === 'string' || (p.content && !(p.embeds && p.embeds.length))));
  const tooLong = out.filter((p) => p.embeds && p.embeds.some((e) => { const d = e.data || e; return (d.description || '').length > 4096 || JSON.stringify(d).length > 6000; }));
  if (process.env.SHOW && new RegExp(process.env.SHOW).test(text)) for (const o of out) console.log('\n>>', text, '\n', JSON.stringify(typeof o === 'string' ? o : { content: o.content, embeds: (o.embeds || []).map((e) => (e.data || e)), components: (o.components || []).length }, null, 1).slice(0, 1400));
  if (threw) { failures++; report.push(`CRASH  ${text}\n       ${threw.split('\n').slice(0, 2).join(' | ')}`); }
  if (plain.length) raw.push(`${text}  ->  ${JSON.stringify(typeof plain[0] === 'string' ? plain[0] : plain[0].content).slice(0, 90)}`);
  if (tooLong.length) { failures++; report.push(`TOOLONG ${text}`); }
  if (!out.length && !threw) report.push(`SILENT ${text}`);
}

const P = process.env.SMOKE_PREFIX || 'y';
// SMOKE_ALL=1 also tries every command and subcommand once with generated arguments.
function generated() {
  const lines = [];
  const arg = (o) => (o.type === 6 ? '@YOU' : o.type === 4 ? String(Math.max(o.min_value || 1, 10)) : o.type === 5 ? 'yes' : o.choices ? String(o.choices[0].value) : o.autocomplete ? 'rose' : 'test');
  for (const c of client.commands.values()) {
    const j = c.data.toJSON(); const subs = (j.options || []).filter((o) => o.type === 1);
    if (['disablecommands', 'enablecommands', 'trustedbots', 'prefix'].includes(j.name)) continue;
    if (!subs.length) lines.push(`${j.name} ${(j.options || []).filter((o) => o.required).map(arg).join(' ')}`);
    for (const sb of subs) { if (j.name === 'privacy' && sb.name === 'delete') continue; lines.push(`${j.name} ${sb.name} ${(sb.options || []).filter((o) => o.required).map(arg).join(' ')}`); }
  }
  return lines;
}
const cmds = ((process.env.SMOKE_ALL || process.argv.includes('--all')) ? generated().join('\n') : require('fs').readFileSync(__dirname + '/smoke-commands.txt', 'utf8'))
  .split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
(async () => {
  store.guild('g1').prefix = P;
  for (const c of cmds) {
    if (c.startsWith('@age')) { const x = store.user(ME.id).eco; for (const r of Object.values((x && x.biz) || {})) { r.t -= 5 * 3600000; r.sup = Date.now() - 3600000; } continue; }
    if (c.startsWith('@lp')) { store.user(ME.id).lp = Number(c.split(' ')[1]); continue; }
    await run(`${P} ${c.replace(/@ME/g, ME.toString()).replace(/@YOU/g, YOU.toString())}`);
  }
  console.log(`\nRan ${cmds.length} commands | crashes/problems: ${failures} | plain-text replies: ${raw.length}`);
  if (report.length) console.log('\n' + report.join('\n'));
  if (raw.length) console.log('\nPLAIN TEXT (should be embeds):\n' + raw.join('\n'));
  store.flush(); process.exit(failures ? 1 : 0);
})();
