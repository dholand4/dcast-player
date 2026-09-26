const { Readable } = require('stream');
const dns = require('dns');
const net = require('net');

const MAX_REDIRECTS = 5;

// Origens autorizadas a usar o proxy (ex.: "https://app.dominio.com,https://outro.com").
// Vazio = qualquer origem, útil só no desenvolvimento local.
const ALLOWED_ORIGINS = (process.env.PROXY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Só ative se o servidor IPTV estiver na mesma rede do proxy.
const ALLOW_PRIVATE_HOSTS = process.env.PROXY_ALLOW_PRIVATE_HOSTS === 'true';

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const ip = address.toLowerCase();
  if (ip.startsWith('::ffff:')) {
    return isPrivateAddress(ip.slice(7));
  }
  return (
    ip === '::' ||
    ip === '::1' ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80') ||
    ip.startsWith('ff')
  );
}

// Bloqueia URLs que não sejam http(s) e hosts da rede interna (SSRF)
async function assertPublicHttpUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('URL inválida'), { statusCode: 400 });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw Object.assign(new Error('Apenas URLs http e https são permitidas'), { statusCode: 400 });
  }
  if (ALLOW_PRIVATE_HOSTS) return;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(hostname)
    ? [hostname]
    : (await dns.promises.lookup(hostname, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw Object.assign(new Error('Destino não permitido'), { statusCode: 403 });
  }
}

function isOriginAllowed(req) {
  if (ALLOWED_ORIGINS.length === 0) return true;
  const origin = req.headers?.['origin'] || req.headers?.['referer'] || '';
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
}

// Segue redirecionamentos manualmente para validar cada destino
async function fetchPublic(url, options) {
  let currentUrl = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicHttpUrl(currentUrl);
    const response = await fetch(currentUrl, { ...options, redirect: 'manual' });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return { response, finalUrl: currentUrl };
  }
  throw Object.assign(new Error('Redirecionamentos demais'), { statusCode: 502 });
}

function setStatus(res, code) {
  if (typeof res.status === 'function') {
    res.status(code);
  } else {
    res.statusCode = code;
  }
}

function sendJson(res, code, data) {
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

module.exports = async function handler(req, res) {
  // Configuração global de CORS para streaming e requisições parciais (byte ranges)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Range, Content-Length, Accept-Ranges, Content-Type, Content-Disposition'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Responde imediatamente a requisições de preflight do navegador
  if (req.method === 'OPTIONS') {
    setStatus(res, 200);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Método não permitido' });
    return;
  }

  if (!isOriginAllowed(req)) {
    sendJson(res, 403, { error: 'Origem não permitida' });
    return;
  }

  const requestedUrl = req.query?.url;
  if (!requestedUrl || typeof requestedUrl !== 'string') {
    sendJson(res, 400, { error: 'Parâmetro url é obrigatório' });
    return;
  }

  const abortController = new AbortController();

  // Se o cliente (navegador) cancelar a conexão (ex: usuário avançou o vídeo, fechou a aba ou trocou de tela), cancela o download upstream imediatamente
  const cleanupUpstream = () => {
    try {
      abortController.abort();
    } catch {}
  };

  if (typeof req.on === 'function') {
    req.on('close', cleanupUpstream);
    req.on('aborted', cleanupUpstream);
  }
  if (typeof res.on === 'function') {
    res.on('close', cleanupUpstream);
  }

  try {
    const upstreamHeaders = {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      'Accept': req.headers?.['accept'] || '*/*',
      'Connection': 'keep-alive',
    };

    // Encaminhar cabeçalhos de Range para permitir avançar/rebobinar (Seek) instantâneo
    if (req.headers?.['range']) {
      upstreamHeaders['Range'] = req.headers['range'];
    }
    if (req.headers?.['if-range']) {
      upstreamHeaders['If-Range'] = req.headers['if-range'];
    }

    const { response: upstreamRes, finalUrl: targetUrl } = await fetchPublic(requestedUrl, {
      method: req.method,
      headers: upstreamHeaders,
      signal: abortController.signal,
    });

    setStatus(res, upstreamRes.status);

    // Encaminha os cabeçalhos cruciais de áudio/vídeo e streaming
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'content-disposition',
      'cache-control',
      'etag',
      'last-modified',
    ];

    for (const h of headersToForward) {
      const val = upstreamRes.headers.get(h);
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
      upstreamRes.status === 206 ||
      upstreamRes.headers.get('content-range') ||
      targetUrl.includes('/movie/') ||
      targetUrl.includes('/series/')
    ) {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    const contentType = (upstreamRes.headers.get('content-type') || '').toLowerCase();

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
      upstreamRes.status === 206 &&
      (targetUrl.includes('/movie/') || targetUrl.includes('/series/'))
    ) {
      // Requisições parciais (Range) de VOD (filmes/séries)
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=120');
    }

    if (req.method === 'HEAD' || !upstreamRes.body) {
      res.end();
      return;
    }

    const isM3u8 =
      targetUrl.includes('.m3u8') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl');

    if (isM3u8) {
      const m3u8Text = await upstreamRes.text();
      const rewrittenText = rewriteM3u8(m3u8Text, targetUrl);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(rewrittenText);
      return;
    }

    if (Readable.fromWeb) {
      const stream = Readable.fromWeb(upstreamRes.body);

      const destroyStream = () => {
        cleanupUpstream();
        try {
          stream.destroy();
        } catch {}
      };

      stream.on('error', () => {
        destroyStream();
        if (!res.headersSent) {
          setStatus(res, 502);
        }
        res.end();
      });

      if (typeof res.on === 'function') {
        res.on('close', destroyStream);
        res.on('finish', destroyStream);
      }
      if (typeof req.on === 'function') {
        req.on('close', destroyStream);
      }

      stream.pipe(res);
    } else {
      const buffer = await upstreamRes.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
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
};
