// Receives Discord "webhook events" so the bot knows EXACTLY who installed / removed it
// (APPLICATION_AUTHORIZED / APPLICATION_DEAUTHORIZED). Discord's own "approximate" install number
// can stay stale for a long time, this one updates instantly.
//
// Needs in Railway Variables:  DISCORD_PUBLIC_KEY  (Developer Portal > General Information > Public Key)
// Then in the Developer Portal > Webhooks: Endpoint URL = https://<your-railway-domain>/webhook,
// turn Events ON and tick "Application Authorized" and "Application Deauthorized".
const http = require('node:http');
const crypto = require('node:crypto');
const store = require('./store');

const PUBLIC_KEY = (process.env.DISCORD_PUBLIC_KEY || '').trim();
const enabled = /^[0-9a-fA-F]{64}$/.test(PUBLIC_KEY);

// Raw 32-byte Ed25519 key -> a key object Node can verify with.
const keyObject = enabled
  ? crypto.createPublicKey({
      key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(PUBLIC_KEY, 'hex')]),
      format: 'der',
      type: 'spki',
    })
  : null;

function verify(req, body) {
  const sig = req.headers['x-signature-ed25519'];
  const ts = req.headers['x-signature-timestamp'];
  if (!sig || !ts) return false;
  try {
    return crypto.verify(null, Buffer.concat([Buffer.from(String(ts)), body]), keyObject, Buffer.from(String(sig), 'hex'));
  } catch {
    return false;
  }
}

function handleEvent(payload) {
  const ev = payload && payload.event;
  if (!ev || !ev.data) return;
  const userId = ev.data.user && ev.data.user.id;
  if (!userId) return;
  if (ev.type === 'APPLICATION_AUTHORIZED') {
    // integration_type 1 = installed to a user's account ("user install"); 0 = added to a server.
    if (ev.data.integration_type === 1) {
      store.addInstall(userId);
      console.log(`[webhook] user install +1 (${store.installCount()} total)`);
    }
  } else if (ev.type === 'APPLICATION_DEAUTHORIZED') {
    if (store.removeInstall(userId)) console.log(`[webhook] user install -1 (${store.installCount()} total)`);
  }
}

function start() {
  if (!enabled) {
    console.log('[webhook] DISCORD_PUBLIC_KEY not set - install counter uses Discord\'s approximate number');
    return;
  }
  const port = Number(process.env.PORT) || 3000;
  const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('ok');
    }
    if (req.method !== 'POST') {
      res.writeHead(405);
      return res.end();
    }
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) req.destroy();
      else chunks.push(c);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (!verify(req, body)) {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        return res.end('invalid signature');
      }
      let payload;
      try {
        payload = JSON.parse(body.toString('utf8'));
      } catch {
        res.writeHead(400);
        return res.end();
      }
      res.writeHead(204, { 'Content-Type': 'application/json' });
      res.end();
      if (payload.type === 1) {
        try {
          handleEvent(payload);
        } catch (err) {
          console.error('[webhook] event error:', err);
        }
      }
    });
  });
  server.listen(port, '0.0.0.0', () => console.log(`[webhook] listening on port ${port} (POST /webhook)`));
  return server;
}

module.exports = { start, enabled };
