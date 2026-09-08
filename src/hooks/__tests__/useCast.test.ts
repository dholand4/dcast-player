import { renderHook, act } from '@testing-library/react-native';
import { useCast } from '../useCast';
import { useRemoteMediaClient, useCastSession, useCastState } from 'react-native-google-cast';

describe('useCast hook', () => {
  const mockLoadMedia = jest.fn().mockResolvedValue(undefined);
  const mockPlay = jest.fn();
  const mockPause = jest.fn();
  const mockSeek = jest.fn();
  const mockStop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCastSession as jest.Mock).mockReturnValue({ id: 'session-123' });
    (useCastState as jest.Mock).mockReturnValue('connected');
    (useRemoteMediaClient as jest.Mock).mockReturnValue({
      loadMedia: mockLoadMedia,
      play: mockPlay,
      pause: mockPause,
      seek: mockSeek,
      stop: mockStop,
    });
  });

  it('detects active cast session', () => {
    const { result } = renderHook(() => useCast());
    expect(result.current.isCasting).toBe(true);
  });

  it('detects cast state connected even if castSession is null', () => {
    (useCastSession as jest.Mock).mockReturnValue(null);
    (useCastState as jest.Mock).mockReturnValue('connected');
    const { result } = renderHook(() => useCast());
    expect(result.current.isCasting).toBe(true);
  });

  it('converts live stream .ts URL to .m3u8 for Chromecast', async () => {
    const { result } = renderHook(() => useCast());

    await act(async () => {
      await result.current.castMedia({
        streamUrl: 'http://server.com/live/user/pass/1234.ts',
        title: 'Globo SP HD',
        type: 'live',
        contentId: '1234',
        initialTime: 50,
      });
    });

    expect(mockLoadMedia).toHaveBeenCalledTimes(1);
    const mediaLoadArg = mockLoadMedia.mock.calls[0][0];

    // Assert that the URL was converted to .m3u8
    expect(mediaLoadArg.mediaInfo.contentUrl).toBe(
      'http://server.com/live/user/pass/1234.m3u8'
    );
    expect(mediaLoadArg.mediaInfo.contentId).toBe(
      'http://server.com/live/user/pass/1234.m3u8'
    );
    // Assert that the content type is HLS
    expect(mediaLoadArg.mediaInfo.contentType).toBe('application/x-mpegURL');
    // Assert that stream type is live
    expect(mediaLoadArg.mediaInfo.streamType).toBe('live');
    // Assert that startTime is undefined for live streams to avoid seek failure on live sliding window
    expect(mediaLoadArg.startTime).toBeUndefined();
  });

  it('casts movie VOD with mp4 content type and buffered stream type', async () => {
    const { result } = renderHook(() => useCast());

    await act(async () => {
      await result.current.castMedia({
        streamUrl: 'http://server.com/movie/user/pass/999.mp4',
        title: 'Inception',
        type: 'movie',
        contentId: '999',
        initialTime: 120,
      });
    });

    expect(mockLoadMedia).toHaveBeenCalledTimes(1);
    const mediaLoadArg = mockLoadMedia.mock.calls[0][0];

    expect(mediaLoadArg.mediaInfo.contentUrl).toBe(
      'http://server.com/movie/user/pass/999.mp4'
    );
    expect(mediaLoadArg.mediaInfo.contentType).toBe('video/mp4');
    expect(mediaLoadArg.mediaInfo.streamType).toBe('buffered');
    expect(mediaLoadArg.startTime).toBe(120);
  });

  it('calls play, pause, seek and stop', () => {
    const { result } = renderHook(() => useCast());

    act(() => {
      result.current.play();
    });
    expect(mockPlay).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.pause();
    });
    expect(mockPause).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.seek(45);
    });
    expect(mockSeek).toHaveBeenCalledWith({ position: 45 });

    act(() => {
      result.current.stopCast();
    });
    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});
