import { Platform } from 'react-native';
import { prefetchService } from '../prefetchService';

describe('prefetchService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    prefetchService.clearPrefetchCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('prefetches stream url with range header', async () => {
    let capturedHeaders: any = null;
    global.fetch = jest.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers;
      return Promise.resolve({
        ok: true,
        status: 206,
        blob: async () => new Blob(['fake video data']),
      });
    });

    const url = 'http://stream.example.com/movie/user/pass/123.mp4';
    const success = await prefetchService.prefetchVod(url);

    expect(success).toBe(true);
    expect(capturedHeaders?.Range).toBe('bytes=0-2097151');
    expect(prefetchService.isPrefetched(url)).toBe(true);
  });

  it('skips duplicate prefetch for the same url', async () => {
    let fetchCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      fetchCount++;
      return Promise.resolve({
        ok: true,
        status: 206,
        blob: async () => new Blob(['fake video data']),
      });
    });

    const url = 'http://stream.example.com/movie/user/pass/456.mp4';
    await prefetchService.prefetchVod(url);
    await prefetchService.prefetchVod(url);

    expect(fetchCount).toBe(1);
  });

  it('handles empty or invalid url gracefully without throwing', async () => {
    const success = await prefetchService.prefetchVod('');
    expect(success).toBe(false);
  });

  it('handles fetch network failures gracefully without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const success = await prefetchService.prefetchVod('http://invalid.url');
    expect(success).toBe(false);
  });

  it('fecha a resposta depois de ler o primeiro pedaço', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 206,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValue({ done: false, value: new Uint8Array(10) }),
          cancel,
        }),
      },
    });

    await prefetchService.prefetchVod('http://stream.example.com/movie/user/pass/789.mp4');

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('não pré-carrega na Web, para não ocupar a tela da lista IPTV', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });
    global.fetch = jest.fn();
    try {
      const success = await prefetchService.prefetchVod('http://stream.example.com/movie/user/pass/1.mp4');
      expect(success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { get: () => originalOS, configurable: true });
    }
  });
});
