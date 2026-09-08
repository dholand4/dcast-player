const { Readable } = require('stream');

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

module.exports = async function handler(req, res) {
  // Configuração global de CORS para streaming e requisições parciais (byte ranges)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
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

  const targetUrl = req.query?.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    sendJson(res, 400, { error: 'Parâmetro url é obrigatório' });
    return;
  }

  const abortController = new AbortController();

  // Se o cliente (navegador) cancelar a conexão (ex: usuário avançou o vídeo), cancela o download upstream
  if (typeof req.on === 'function') {
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });
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

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: upstreamHeaders,
      signal: abortController.signal,
      redirect: 'follow',
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

    if (req.method === 'HEAD' || !upstreamRes.body) {
      res.end();
      return;
    }

    if (Readable.fromWeb) {
      const stream = Readable.fromWeb(upstreamRes.body);

      stream.on('error', () => {
        abortController.abort();
        if (!res.headersSent) {
          setStatus(res, 502);
        }
        res.end();
      });

      if (typeof res.on === 'function') {
        res.on('close', () => {
          if (!res.writableEnded) {
            abortController.abort();
            stream.destroy();
          }
        });
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
    sendJson(res, 502, {
      error: 'Erro de conexão com o servidor IPTV',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
