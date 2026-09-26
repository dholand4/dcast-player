import { xtreamService, XtreamError } from '../xtreamService';

describe('xtreamService', () => {
  const creds = {
    serverUrl: 'http://my-iptv.com:8080',
    username: 'user1',
    password: 'pass1',
    label: 'Test List',
  };

  it('builds live stream URL defaulting to .ts', () => {
    const url = xtreamService.buildLiveStreamUrl(creds, 12345);
    expect(url).toBe('http://my-iptv.com:8080/live/user1/pass1/12345.ts');
  });

  it('builds live stream URL with custom extension', () => {
    const url = xtreamService.buildLiveStreamUrl(creds, 12345, 'm3u8');
    expect(url).toBe('http://my-iptv.com:8080/live/user1/pass1/12345.m3u8');
  });

  it('builds VOD stream URL with custom extension', () => {
    const url = xtreamService.buildVodStreamUrl(creds, 999, 'mkv');
    expect(url).toBe('http://my-iptv.com:8080/movie/user1/pass1/999.mkv');
  });

  it('swaps .ts and .m3u8 in getAlternativeLiveStreamUrl', () => {
    const tsUrl = 'http://my-iptv.com:8080/live/user1/pass1/12345.ts';
    const m3u8Url = 'http://my-iptv.com:8080/live/user1/pass1/12345.m3u8';

    expect(xtreamService.getAlternativeLiveStreamUrl(tsUrl)).toBe(m3u8Url);
    expect(xtreamService.getAlternativeLiveStreamUrl(m3u8Url)).toBe(tsUrl);
    expect(xtreamService.getAlternativeLiveStreamUrl('http://other.com/video.mp4')).toBeNull();
  });

  it('safely converts arrays and object dictionaries with toArray', () => {
    const { toArray } = require('../xtreamService');
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(toArray({ a: { id: 1 }, b: { id: 2 } })).toEqual([{ id: 1 }, { id: 2 }]);
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray('invalid')).toEqual([]);
  });

  it('safely decodes Base64 EPG titles without distorting plain text and handles HTML entities', () => {
    const { safeDecodeBase64, cleanHtmlEntities } = require('../xtreamService');

    // Base64 valid encoded
    expect(safeDecodeBase64('Sm9ybmFsIE5hY2lvbmFs')).toBe('Jornal Nacional');
    expect(safeDecodeBase64('U2Vzc8OjbyBkYSBUYXJkZQ==')).toBe('Sessão da Tarde');

    // Plain text should NOT be altered
    expect(safeDecodeBase64('Jornal Nacional')).toBe('Jornal Nacional');
    expect(safeDecodeBase64('Fantástico')).toBe('Fantástico');
    expect(safeDecodeBase64('News')).toBe('News');
    expect(safeDecodeBase64('Batman')).toBe('Batman');

    // HTML entities
    expect(safeDecodeBase64('Telecine &amp; Pipoca')).toBe('Telecine & Pipoca');
    expect(cleanHtmlEntities('Rock&#039;n&#x27;Roll &quot;Live&quot;')).toBe("Rock'n'Roll \"Live\"");
  });

  describe('authenticate', () => {
    const mockAuthResponse = (userInfo: object) =>
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user_info: userInfo, server_info: {} }),
      } as Response);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('accepts an active account', async () => {
      mockAuthResponse({ auth: 1, status: 'Active', exp_date: String(Date.now() / 1000 + 86400) });
      await expect(xtreamService.authenticate(creds)).resolves.toBeDefined();
    });

    it('rejects an expired account with a friendly message', async () => {
      mockAuthResponse({ auth: 1, status: 'Expired' });
      await expect(xtreamService.authenticate(creds)).rejects.toMatchObject({
        kind: 'expired',
        message: expect.stringContaining('assinatura expirou'),
      });
    });

    it('treats a past exp_date as expired even when status is Active', async () => {
      mockAuthResponse({ auth: 1, status: 'Active', exp_date: '1600000000' });
      await expect(xtreamService.authenticate(creds)).rejects.toMatchObject({ kind: 'expired' });
    });

    it('rejects invalid credentials', async () => {
      mockAuthResponse({ auth: 0 });
      await expect(xtreamService.authenticate(creds)).rejects.toMatchObject({ kind: 'auth' });
    });

    it('translates HTTP and network failures', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 404 } as Response);
      await expect(xtreamService.authenticate(creds)).rejects.toMatchObject({
        kind: 'http',
        message: expect.stringContaining('Confira a URL'),
      });

      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new TypeError('Network request failed'));
      const err = await xtreamService.authenticate(creds).catch((e) => e);
      expect(err).toBeInstanceOf(XtreamError);
      expect(err.kind).toBe('network');
    });
  });
});
