jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(async (host: string) =>
      host === 'intranet.local' ? [{ address: '10.0.0.5', family: 4 }] : [{ address: '203.0.113.10', family: 4 }]
    ),
  },
}));

const proxyHandler = require('../../../api/proxy.js');

global.fetch = jest.fn();

describe('api/proxy.js', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      method: 'GET',
      query: {},
    };
    res = {
      setHeader: jest.fn(),
      statusCode: 200,
      end: jest.fn(),
    };
  });

  it('sets CORS headers and handles OPTIONS preflight', async () => {
    req.method = 'OPTIONS';
    await proxyHandler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('rejects methods other than GET and HEAD', async () => {
    req.method = 'POST';
    req.query.url = 'http://iptv.server/player_api.php';
    await proxyHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects non-http protocols', async () => {
    req.query.url = 'file:///etc/passwd';
    await proxyHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks internal network destinations (SSRF)', async () => {
    for (const url of ['http://127.0.0.1:8080/', 'http://169.254.169.254/latest', 'http://intranet.local/']) {
      req.query.url = url;
      await proxyHandler(req, res);
      expect(res.statusCode).toBe(403);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates each redirect target before following it', async () => {
    req.query.url = 'http://iptv.server/movie/1.mp4';
    const redirectHeaders = new Headers();
    redirectHeaders.set('location', 'http://127.0.0.1/admin');
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 302, headers: redirectHeaders, body: null });

    await proxyHandler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(403);
  });

  it('does not leak upstream error details', async () => {
    req.query.url = 'http://iptv.server/live/1.ts';
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('connect ECONNREFUSED 203.0.113.10:80'));

    await proxyHandler(req, res);

    expect(res.statusCode).toBe(502);
    expect(res.end).toHaveBeenCalledWith(expect.not.stringContaining('ECONNREFUSED'));
  });

  it('returns 400 if url parameter is missing', async () => {
    await proxyHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.end).toHaveBeenCalledWith(
      expect.stringContaining('Parâmetro url é obrigatório')
    );
  });

  it('proxies request and forwards content-type', async () => {
    req.query.url = 'http://iptv.server/player_api.php?user=1&pass=1';

    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/json');

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      headers: mockHeaders,
      body: null,
    });

    await proxyHandler(req, res);

    expect(fetch).toHaveBeenCalledWith(
      'http://iptv.server/player_api.php?user=1&pass=1',
      expect.any(Object)
    );
    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.end).toHaveBeenCalled();
  });

  it('forwards Range header and returns 206 Partial Content with Content-Range for video seeking', async () => {
    req.query.url = 'http://iptv.server/movie/user/pass/123.mp4';
    req.headers = { range: 'bytes=1048576-' };

    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'video/mp4');
    mockHeaders.set('content-length', '5000000');
    mockHeaders.set('content-range', 'bytes 1048576-6048575/6048576');
    mockHeaders.set('accept-ranges', 'bytes');

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 206,
      headers: mockHeaders,
      body: null,
    });

    await proxyHandler(req, res);

    expect(fetch).toHaveBeenCalledWith(
      'http://iptv.server/movie/user/pass/123.mp4',
      expect.objectContaining({
        headers: expect.objectContaining({
          Range: 'bytes=1048576-',
          'User-Agent': expect.stringContaining('VLC'),
        }),
      })
    );
    expect(res.statusCode).toBe(206);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Range', 'bytes 1048576-6048575/6048576');
    expect(res.setHeader).toHaveBeenCalledWith('Accept-Ranges', 'bytes');
    expect(res.end).toHaveBeenCalled();
  });

  it('rewrites relative and absolute chunk URLs in m3u8 playlists', async () => {
    req.query.url = 'http://iptv.server:8080/live/user/pass/123.m3u8';

    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'application/vnd.apple.mpegurl');

    const sampleM3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
chunk_100.ts
#EXTINF:10.0,
http://cdn.iptv.com/live/chunk_101.ts`;

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      headers: mockHeaders,
      body: {},
      text: async () => sampleM3u8,
    });

    await proxyHandler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.mpegurl');
    expect(res.end).toHaveBeenCalledWith(
      expect.stringContaining('/api/proxy?url=http%3A%2F%2Fiptv.server%3A8080%2Flive%2Fuser%2Fpass%2Fchunk_100.ts')
    );
    expect(res.end).toHaveBeenCalledWith(
      expect.stringContaining('/api/proxy?url=http%3A%2F%2Fcdn.iptv.com%2Flive%2Fchunk_101.ts')
    );
  });

  it('adds edge cache headers and keep-alive for video segments (.ts chunks)', async () => {
    req.query.url = 'http://iptv.server:8080/live/user/pass/chunk_100.ts';

    const mockHeaders = new Headers();
    mockHeaders.set('content-type', 'video/mp2t');

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      headers: mockHeaders,
      body: null,
    });

    await proxyHandler(req, res);

    expect(fetch).toHaveBeenCalledWith(
      'http://iptv.server:8080/live/user/pass/chunk_100.ts',
      expect.objectContaining({
        headers: expect.objectContaining({
          Connection: 'keep-alive',
          'User-Agent': expect.stringContaining('VLC'),
        }),
      })
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('s-maxage=300')
    );
  });
});
