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
});
