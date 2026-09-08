import { xtreamService } from '../xtreamService';

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
});
