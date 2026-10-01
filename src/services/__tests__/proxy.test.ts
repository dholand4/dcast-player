/**
 * @jest-environment node
 */
import http from 'http';
import { AddressInfo } from 'net';

jest.mock('dns', () => {
  const actual = jest.requireActual('dns');
  return {
    ...actual,
    lookup: jest.fn((hostname: string, options: any, callback: any) => {
      if (hostname === 'intranet.test') {
        callback(null, [{ address: '10.0.0.5', family: 4 }]);
        return;
      }
      if (hostname === 'iptv.test') {
        callback(null, [{ address: '8.8.8.8', family: 4 }]);
        return;
      }
      actual.lookup(hostname, options, callback);
    }),
  };
});

type ProxyModule = ((req: any, res: any) => Promise<void>) & { _internals: any };

const ENV_KEYS = [
  'PROXY_ALLOWED_ORIGINS',
  'PROXY_ALLOW_PRIVATE_HOSTS',
  'PROXY_RATE_LIMIT_PER_MINUTE',
  'PROXY_UPSTREAM_TIMEOUT_MS',
];

function loadProxy(env: Record<string, string> = {}): ProxyModule {
  ENV_KEYS.forEach((key) => delete process.env[key]);
  Object.assign(process.env, env);
  let mod: ProxyModule | undefined;
  jest.isolateModules(() => {
    mod = require('../../../api/proxy.js');
  });
  ENV_KEYS.forEach((key) => delete process.env[key]);
  return mod!;
}

const servers: http.Server[] = [];

function listen(server: http.Server): Promise<string> {
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}

// Servidor que faz o papel do servidor IPTV
let upstreamHits: string[] = [];
let upstreamUrl = '';

function startUpstream() {
  return listen(
    http.createServer((req, res) => {
      upstreamHits.push(req.url || '');
      if (req.url === '/player_api.php') {
        res.setHeader('Content-Type', 'application/json');
        res.end('{"ok":true}');
      } else if (req.url === '/movie/u/p/1.mp4') {
        res.statusCode = req.headers.range ? 206 : 200;
        res.setHeader('Content-Type', 'video/mp4');
        if (req.headers.range) res.setHeader('Content-Range', 'bytes 10-19/100');
        res.end(req.headers.range ? `range:${req.headers.range}` : 'video');
      } else if (req.url === '/live/u/p/1.m3u8') {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.end('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:10.0,\nchunk_100.ts\n#EXTINF:10.0,\nhttp://cdn.iptv.com/live/chunk_101.ts');
      } else if (req.url === '/live/u/p/huge.m3u8') {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.end(`#EXTM3U\n${'#'.repeat(6 * 1024 * 1024)}`);
      } else if (req.url === '/live/u/p/chunk.ts') {
        res.setHeader('Content-Type', 'video/mp2t');
        res.end('ts');
      } else if (req.url === '/evil.html') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<script>alert(localStorage.saved_accounts)</script>');
      } else if (req.url === '/slow') {
        // Nunca responde
      } else {
        res.statusCode = 404;
        res.end();
      }
    })
  );
}

function startProxy(handler: ProxyModule) {
  return listen(
    http.createServer((req, res) => {
      const parsed = new URL(req.url || '/', 'http://localhost');
      (req as any).query = { url: parsed.searchParams.get('url') };
      handler(req, res);
    })
  );
}

interface IProxyResponse {
  status: number;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
  json: () => Promise<any>;
}

function callProxy(
  proxyBase: string,
  target: string | null,
  init: { method?: string; headers?: Record<string, string> } = {}
): Promise<IProxyResponse> {
  const query = target === null ? '' : `?url=${encodeURIComponent(target)}`;
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${proxyBase}/api/proxy${query}`,
      { method: init.method || 'GET', headers: init.headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode || 0,
            headers: {
              get: (name) => {
                const value = res.headers[name.toLowerCase()];
                return value === undefined ? null : String(value);
              },
            },
            text: async () => body,
            json: async () => JSON.parse(body),
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  upstreamUrl = await startUpstream();
});

beforeEach(() => {
  upstreamHits = [];
});

afterAll(async () => {
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
});

describe('api/proxy.js', () => {
  describe('isBlockedAddress', () => {
    const { isBlockedAddress } = loadProxy()._internals;

    it.each([
      '127.0.0.1',
      '10.1.2.3',
      '172.20.0.1',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '224.0.0.1',
      '::',
      '::1',
      '::ffff:7f00:1',
      '::ffff:127.0.0.1',
      '::ffff:a9fe:a9fe',
      '::7f00:1',
      '64:ff9b::7f00:1',
      '64:ff9b::a00:1',
      '2002:7f00:1::',
      'fc00::1',
      'fd12:3456::1',
      'fe80::1',
      'ff02::1',
    ])('bloqueia %s', (address) => {
      expect(isBlockedAddress(address)).toBe(true);
    });

    it.each(['8.8.8.8', '177.10.20.30', '2606:4700::1111', '::ffff:808:808', '64:ff9b::808:808'])(
      'libera o endereço público %s',
      (address) => {
        expect(isBlockedAddress(address)).toBe(false);
      }
    );
  });

  describe('com o bloqueio de rede interna ativo (padrão)', () => {
    let proxyBase = '';

    beforeAll(async () => {
      proxyBase = await startProxy(loadProxy());
    });

    it('responde ao preflight com CORS', async () => {
      const res = await callProxy(proxyBase, null, { method: 'OPTIONS' });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });

    it('recusa métodos diferentes de GET e HEAD', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`, { method: 'POST' });
      expect(res.status).toBe(405);
    });

    it('retorna 400 sem o parâmetro url', async () => {
      const res = await callProxy(proxyBase, null);
      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Parâmetro url é obrigatório');
    });

    it('recusa protocolos que não sejam http(s)', async () => {
      const res = await callProxy(proxyBase, 'file:///etc/passwd');
      expect(res.status).toBe(400);
    });

    it.each([
      (port: string) => `http://127.0.0.1:${port}/player_api.php`,
      (port: string) => `http://[::ffff:127.0.0.1]:${port}/player_api.php`,
      (port: string) => `http://[::ffff:7f00:1]:${port}/player_api.php`,
      (port: string) => `http://[::1]:${port}/player_api.php`,
      (port: string) => `http://0x7f.1:${port}/player_api.php`,
      (port: string) => `http://2130706433:${port}/player_api.php`,
      (port: string) => `http://localhost:${port}/player_api.php`,
      () => 'http://169.254.169.254/latest/meta-data',
      () => 'http://intranet.test/',
    ])('bloqueia destino da rede interna (SSRF) %#', async (buildUrl) => {
      const port = new URL(upstreamUrl).port;
      const res = await callProxy(proxyBase, buildUrl(port));
      expect(res.status).toBe(403);
      expect(upstreamHits).toHaveLength(0);
    });

    it('não vaza detalhes do erro do servidor IPTV', async () => {
      const res = await callProxy(proxyBase, 'http://nao-existe.invalid/live/1.ts');
      expect(res.status).toBe(502);
      expect(await res.text()).not.toMatch(/ENOTFOUND|getaddrinfo/);
    });

    it('envia cabeçalhos que impedem o conteúdo de rodar como página do app', async () => {
      const res = await callProxy(proxyBase, 'file:///x');
      expect(res.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'");
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    });
  });

  describe('validação de redirecionamentos', () => {
    it('valida cada destino antes de seguir o redirecionamento', async () => {
      const proxy = loadProxy();
      const { transport } = proxy._internals;
      const { PassThrough } = jest.requireActual('stream');
      const redirect = Object.assign(new PassThrough(), {
        statusCode: 302,
        headers: { location: 'http://[::ffff:169.254.169.254]/latest' },
      });
      redirect.end();
      const spy = jest.spyOn(transport, 'request').mockResolvedValueOnce(redirect);
      const proxyBase = await startProxy(proxy);

      const res = await callProxy(proxyBase, 'http://iptv.test/movie/u/p/1.mp4');

      expect(res.status).toBe(403);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('com hosts privados liberados (servidor IPTV de teste local)', () => {
    let proxyBase = '';

    beforeAll(async () => {
      proxyBase = await startProxy(loadProxy({ PROXY_ALLOW_PRIVATE_HOSTS: 'true', PROXY_UPSTREAM_TIMEOUT_MS: '300' }));
    });

    it('repassa a resposta e o content-type', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/json');
      expect(await res.json()).toEqual({ ok: true });
    });

    it('encaminha o Range e devolve 206 para o avanço do vídeo', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/movie/u/p/1.mp4`, {
        headers: { Range: 'bytes=10-19' },
      });
      expect(res.status).toBe(206);
      expect(res.headers.get('content-range')).toBe('bytes 10-19/100');
      expect(res.headers.get('accept-ranges')).toBe('bytes');
      expect(await res.text()).toBe('range:bytes=10-19');
    });

    it('reescreve as URLs relativas e absolutas da playlist m3u8', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/live/u/p/1.m3u8`);
      const body = await res.text();
      const base = encodeURIComponent(`${upstreamUrl}/live/u/p/`);
      expect(res.headers.get('content-type')).toBe('application/vnd.apple.mpegurl');
      expect(body).toContain(`/api/proxy?url=${base}chunk_100.ts`);
      expect(body).toContain(`URI="/api/proxy?url=${base}key.bin"`);
      expect(body).toContain('/api/proxy?url=http%3A%2F%2Fcdn.iptv.com%2Flive%2Fchunk_101.ts');
    });

    it('recusa playlists grandes demais', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/live/u/p/huge.m3u8`);
      expect(res.status).toBe(502);
    });

    it('adiciona cache de borda nos segmentos .ts', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/live/u/p/chunk.ts`);
      expect(res.headers.get('cache-control')).toContain('s-maxage=300');
      expect(await res.text()).toBe('ts');
    });

    it('serve HTML de terceiros em sandbox, sem acesso ao app', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/evil.html`);
      expect(res.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'");
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    });

    it('desiste quando o servidor IPTV não responde a tempo', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/slow`);
      expect(res.status).toBe(504);
    });
  });

  describe('origens autorizadas', () => {
    let proxyBase = '';

    beforeAll(async () => {
      proxyBase = await startProxy(
        loadProxy({ PROXY_ALLOWED_ORIGINS: 'https://app.dcast.com', PROXY_ALLOW_PRIVATE_HOSTS: 'true' })
      );
    });

    it('aceita a origem exata e devolve ela no CORS', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`, {
        headers: { Origin: 'https://app.dcast.com' },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('https://app.dcast.com');
    });

    it('aceita o Referer de uma página do app', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`, {
        headers: { Referer: 'https://app.dcast.com/player?id=1' },
      });
      expect(res.status).toBe(200);
    });

    it.each(['https://app.dcast.com.atacante.net', 'https://app.dcast.com:8443', 'http://app.dcast.com'])(
      'recusa a origem parecida %s',
      async (origin) => {
        const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`, { headers: { Origin: origin } });
        expect(res.status).toBe(403);
        expect(upstreamHits).toHaveLength(0);
      }
    );

    it('recusa requisições sem origem', async () => {
      const res = await callProxy(proxyBase, `${upstreamUrl}/player_api.php`);
      expect(res.status).toBe(403);
    });
  });

  describe('limite de requisições por IP', () => {
    it('responde 429 quando o limite por minuto é ultrapassado', async () => {
      const proxyBase = await startProxy(
        loadProxy({ PROXY_RATE_LIMIT_PER_MINUTE: '2', PROXY_ALLOW_PRIVATE_HOSTS: 'true' })
      );
      const target = `${upstreamUrl}/player_api.php`;

      expect((await callProxy(proxyBase, target)).status).toBe(200);
      expect((await callProxy(proxyBase, target)).status).toBe(200);
      const limited = await callProxy(proxyBase, target);
      expect(limited.status).toBe(429);
      expect(limited.headers.get('retry-after')).toBe('60');
    });
  });
});
