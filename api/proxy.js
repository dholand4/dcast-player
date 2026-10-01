const http = require('http');
const https = require('https');
const dns = require('dns');
const net = require('net');

const MAX_REDIRECTS = 5;
// Tempo máximo até o servidor IPTV começar a responder (conexão + cabeçalhos)
const UPSTREAM_HEADERS_TIMEOUT_MS = Number(process.env.PROXY_UPSTREAM_TIMEOUT_MS) || 20000;
// Playlists HLS são lidas inteiras na memória para reescrever as URLs
const MAX_PLAYLIST_BYTES = 5 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_PER_MINUTE = Number(process.env.PROXY_RATE_LIMIT_PER_MINUTE) || 1200;
// Só ative se o proxy estiver atrás de um nginx/CDN que preenche o X-Forwarded-For
const TRUST_PROXY = process.env.PROXY_TRUST_PROXY === 'true';

function normalizeOrigin(value) {
  try {
    const { origin } = new URL(value);
    return origin && origin !== 'null' ? origin : null;
  } catch {
    return null;
  }
}

// Origens autorizadas a usar o proxy (ex.: "https://app.dominio.com,https://outro.com").
// Vazio = qualquer origem, útil só no desenvolvimento local.
const ALLOWED_ORIGINS = (process.env.PROXY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => normalizeOrigin(o.trim()))
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0 && process.env.NODE_ENV === 'production') {
  console.warn('[proxy] PROXY_ALLOWED_ORIGINS vazio: qualquer site consegue usar este proxy.');
}

// Só ative se o servidor IPTV estiver na mesma rede do proxy.
const ALLOW_PRIVATE_HOSTS = process.env.PROXY_ALLOW_PRIVATE_HOSTS === 'true';

const blockedIPv4 = new net.BlockList();
[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 3],
].forEach(([address, prefix]) => blockedIPv4.addSubnet(address, prefix, 'ipv4'));

const blockedIPv6 = new net.BlockList();
[
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
].forEach(([address, prefix]) => blockedIPv6.addSubnet(address, prefix, 'ipv6'));

function ipv6ToHextets(address) {
  let ip = address.toLowerCase().split('%')[0];
  const dotted = ip.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number);
    ip = `${ip.slice(0, -dotted[0].length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = ip.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = ip.includes('::') ? 8 - headParts.length - tailParts.length : 0;
  return [...headParts, ...Array(missing).fill('0'), ...tailParts].map((part) => parseInt(part, 16));
}

// IPv4 escondido dentro de um IPv6 (::a.b.c.d, ::ffff:a.b.c.d, NAT64 e 6to4)
function embeddedIPv4(address) {
  const [a, b, c, d, e, f, g, h] = ipv6ToHextets(address);
  const toIPv4 = (hi, lo) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && (f === 0 || f === 0xffff)) {
    return toIPv4(g, h);
  }
  if (a === 0x64 && b === 0xff9b && c === 0 && d === 0 && e === 0 && f === 0) return toIPv4(g, h);
  if (a === 0x2002) return toIPv4(b, c);
  return null;
}

function isBlockedAddress(address) {
  if (net.isIPv4(address)) return blockedIPv4.check(address, 'ipv4');
  if (!net.isIPv6(address)) return true;
  const ipv4 = embeddedIPv4(address);
  if (ipv4) return blockedIPv4.check(ipv4, 'ipv4');
  return blockedIPv6.check(address, 'ipv6');
}

function blockedError() {
  return Object.assign(new Error('Destino não permitido'), { statusCode: 403 });
}

// Valida o IP no momento da conexão, então um DNS que muda de resposta
// entre a checagem e o download (DNS rebinding) não passa.
function safeLookup(hostname, options, callback) {
  const opts = typeof options === 'number' ? { family: options } : options || {};
  dns.lookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) {
      callback(err);
      return;
    }
    const list = Array.isArray(addresses) ? addresses : [];
    if (list.length === 0 || (!ALLOW_PRIVATE_HOSTS && list.some((entry) => isBlockedAddress(entry.address)))) {
      callback(blockedError());
      return;
    }
    if (opts.all) {
      callback(null, list);
    } else {
      callback(null, list[0].address, list[0].family);
    }
  });
}

// Bloqueia URLs que não sejam http(s) e IPs da rede interna escritos direto na URL
function assertAllowedUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('URL inválida'), { statusCode: 400 });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw Object.assign(new Error('Apenas URLs http e https são permitidas'), { statusCode: 400 });
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  if (!ALLOW_PRIVATE_HOSTS && net.isIP(hostname) && isBlockedAddress(hostname)) {
    throw blockedError();
  }
  return parsed;
}

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const transport = {
  // Resolve com a resposta assim que os cabeçalhos chegam; o corpo é lido depois
  request(target, { method, headers, signal }) {
    return new Promise((resolve, reject) => {
      const isHttps = target.protocol === 'https:';
      const upstreamReq = (isHttps ? https : http).request(
        target,
        {
          method,
          headers,
          signal,
          lookup: safeLookup,
          agent: isHttps ? httpsAgent : httpAgent,
        },
        (upstreamRes) => {
          upstreamReq.setTimeout(0);
          resolve(upstreamRes);
        }
      );
      upstreamReq.setTimeout(UPSTREAM_HEADERS_TIMEOUT_MS, () => {
        upstreamReq.destroy(Object.assign(new Error('Tempo esgotado'), { statusCode: 504 }));
      });
      upstreamReq.on('error', reject);
      upstreamReq.end();
    });
  },
};

// Segue redirecionamentos manualmente para validar cada destino
async function fetchAllowed(url, options) {
  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const target = assertAllowedUrl(currentUrl);
    const response = await transport.request(target, options);
    const location = getHeader(response, 'location');
    if (response.statusCode >= 300 && response.statusCode < 400 && location) {
      response.resume();
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return { response, finalUrl: currentUrl };
  }
  throw Object.assign(new Error('Redirecionamentos demais'), { statusCode: 502 });
}

function getHeader(response, name) {
  const value = response.headers?.[name];
  return Array.isArray(value) ? value.join(', ') : value;
}

async function readLimited(stream, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) {
      stream.destroy();
      throw Object.assign(new Error('Playlist grande demais'), { statusCode: 502 });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function requestOrigin(req) {
  const origin = req.headers?.['origin'];
  if (origin && origin !== 'null') return normalizeOrigin(origin);
  const referer = req.headers?.['referer'];
  return referer ? normalizeOrigin(referer) : null;
}

function isOriginAllowed(req) {
  if (ALLOWED_ORIGINS.length === 0) return true;
  const origin = requestOrigin(req);
  return Boolean(origin) && ALLOWED_ORIGINS.includes(origin);
}

const rateLimitHits = new Map();

function clientIp(req) {
  if (TRUST_PROXY) {
    // O último endereço é o que o nginx acrescentou; os anteriores vêm do cliente
    const forwarded = String(req.headers?.['x-forwarded-for'] || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (forwarded.length > 0) return forwarded[forwarded.length - 1];
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = clientIp(req);
  let entry = rateLimitHits.get(ip);
  if (!entry || now - entry.start >= RATE_LIMIT_WINDOW_MS) {
    entry = { start: now, count: 0 };
    rateLimitHits.set(ip, entry);
  }
  entry.count += 1;
  if (rateLimitHits.size > 10000) {
    for (const [key, value] of rateLimitHits) {
      if (now - value.start >= RATE_LIMIT_WINDOW_MS) rateLimitHits.delete(key);
    }
  }
  return entry.count > RATE_LIMIT_PER_MINUTE;
}

function setStatus(res, code) {
  if (typeof res.status === 'function') {
    res.status(code);
  } else {
    res.statusCode = code;
  }
}

const FORWARDED_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'content-disposition',
  'cache-control',
  'etag',
  'last-modified',
];

function sendJson(res, code, data) {
  if (res.headersSent) {
    res.end();
    return;
  }
  // Descarta os cabeçalhos já copiados do servidor IPTV (ex.: Content-Length da playlist)
  FORWARDED_HEADERS.forEach((name) => res.removeHeader?.(name));
  setStatus(res, code);
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.json === 'function') {
    res.json(data);
  } else {
    res.end(JSON.stringify(data));
  }
}

function rewriteM3u8(m3u8Text, baseUrl) {
  const lines = m3u8Text.split('\n');
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Se for linha de comentário ou metadados HLS
    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI="')) {
        return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
          try {
            const absoluteUri = new URL(uri, baseUrl).toString();
            return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}"`;
          } catch {
            return match;
          }
        });
      }
      return line;
    }

    // Linha de segmento de mídia (.ts, .aac, .m4s) ou sub-playlist (.m3u8)
    try {
      const absoluteUrl = new URL(trimmed, baseUrl).toString();
      return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    } catch {
      return line;
    }
  });

  return rewritten.join('\n');
}

function handler(req, res) {
  // O conteúdo vem de servidores de terceiros: nunca deixa rodar como página do app
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  // CORS para streaming e requisições parciais (byte ranges)
  const origin = requestOrigin(req);
  if (ALLOWED_ORIGINS.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Vary', 'Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, Accept');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Range, Content-Length, Accept-Ranges, Content-Type, Content-Disposition'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Responde imediatamente a requisições de preflight do navegador
  if (req.method === 'OPTIONS') {
    setStatus(res, 200);
    res.end();
    return Promise.resolve();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Método não permitido' });
    return Promise.resolve();
  }

  if (!isOriginAllowed(req)) {
    sendJson(res, 403, { error: 'Origem não permitida' });
    return Promise.resolve();
  }

  if (isRateLimited(req)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)));
    sendJson(res, 429, { error: 'Muitas requisições. Aguarde um pouco.' });
    return Promise.resolve();
  }

  const requestedUrl = req.query?.url;
  if (!requestedUrl || typeof requestedUrl !== 'string') {
    sendJson(res, 400, { error: 'Parâmetro url é obrigatório' });
    return Promise.resolve();
  }

  return proxyRequest(req, res, requestedUrl);
}

async function proxyRequest(req, res, requestedUrl) {
  const abortController = new AbortController();

  // Se o cliente (navegador) cancelar a conexão (ex: usuário avançou o vídeo, fechou a aba ou trocou de tela), cancela o download upstream imediatamente
  const cleanupUpstream = () => {
    try {
      abortController.abort();
    } catch {}
  };

  if (typeof req.on === 'function') {
    req.on('aborted', cleanupUpstream);
  }
  if (typeof res.on === 'function') {
    res.on('close', cleanupUpstream);
  }

  try {
    const upstreamHeaders = {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      'Accept': req.headers?.['accept'] || '*/*',
    };

    // Encaminhar cabeçalhos de Range para permitir avançar/rebobinar (Seek) instantâneo
    if (req.headers?.['range']) {
      upstreamHeaders['Range'] = req.headers['range'];
    }
    if (req.headers?.['if-range']) {
      upstreamHeaders['If-Range'] = req.headers['if-range'];
    }

    const { response: upstreamRes, finalUrl: targetUrl } = await fetchAllowed(requestedUrl, {
      method: req.method,
      headers: upstreamHeaders,
      signal: abortController.signal,
    });

    setStatus(res, upstreamRes.statusCode);

    // Encaminha os cabeçalhos cruciais de áudio/vídeo e streaming
    for (const h of FORWARDED_HEADERS) {
      const val = getHeader(upstreamRes, h);
      if (val) {
        const capitalized = h
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
        res.setHeader(capitalized, val);
      }
    }

    // Garante que o navegador saiba que o servidor suporta byte ranges para seeking
    if (
      upstreamRes.statusCode === 206 ||
      getHeader(upstreamRes, 'content-range') ||
      targetUrl.includes('/movie/') ||
      targetUrl.includes('/series/')
    ) {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    const contentType = (getHeader(upstreamRes, 'content-type') || '').toLowerCase();

    // Segmentos de vídeo (.ts, .m4s, .aac, video/mp2t)
    const isSegment =
      targetUrl.includes('.ts') ||
      targetUrl.includes('.m4s') ||
      targetUrl.includes('.aac') ||
      contentType.includes('video/mp2t');

    if (isSegment) {
      // Chunks de vídeo de IPTV são imutáveis. Cachear no CDN/proxy reverso
      // permite entrega ultrarrápida e absorve oscilações da rede sem travar o player.
      res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=60');
    } else if (
      upstreamRes.statusCode === 206 &&
      (targetUrl.includes('/movie/') || targetUrl.includes('/series/'))
    ) {
      // Requisições parciais (Range) de VOD (filmes/séries)
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=120');
    }

    if (req.method === 'HEAD') {
      upstreamRes.resume();
      res.end();
      return;
    }

    const isM3u8 =
      targetUrl.includes('.m3u8') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl');

    if (isM3u8) {
      const m3u8Text = await readLimited(upstreamRes, MAX_PLAYLIST_BYTES);
      const rewrittenText = rewriteM3u8(m3u8Text, targetUrl);
      res.removeHeader?.('Content-Length');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(rewrittenText);
      return;
    }

    const destroyStream = () => {
      cleanupUpstream();
      upstreamRes.destroy();
    };

    upstreamRes.on('error', () => {
      destroyStream();
      if (!res.headersSent) {
        setStatus(res, 502);
      }
      res.end();
    });

    if (typeof res.on === 'function') {
      res.on('close', destroyStream);
    }

    upstreamRes.pipe(res);
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) {
      // O cliente cancelou a requisição intencionalmente (ex: seek ou troca de página)
      return;
    }
    if (err && err.statusCode) {
      sendJson(res, err.statusCode, { error: err.message });
      return;
    }
    sendJson(res, 502, { error: 'Erro de conexão com o servidor IPTV' });
  }
}

module.exports = handler;
module.exports._internals = { isBlockedAddress, safeLookup, transport, rateLimitHits };
