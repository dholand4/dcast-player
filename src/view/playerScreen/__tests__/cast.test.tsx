import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { useVideoPlayer } from 'expo-video';
import { theme } from '../../../constants/theme';
import { PlayerScreen } from '../index';
import { CastContext, ICastContextData } from '../../../providers/CastProvider';
import { PlayerScreenProps } from '../../../routes/types';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
} as unknown as PlayerScreenProps['navigation'];

const episodes = [
  { id: '101', title: 'Ted Lasso - T1E1', streamUrl: 'http://server.com/101.mp4', seasonNumber: 1, episodeNumber: 1 },
  { id: '102', title: 'Ted Lasso - T1E2', streamUrl: 'http://server.com/102.mp4', seasonNumber: 1, episodeNumber: 2 },
  { id: '103', title: 'Ted Lasso - T1E3', streamUrl: 'http://server.com/103.mp4', seasonNumber: 1, episodeNumber: 3 },
];

const episodeRoute = (index: number) =>
  ({
    key: 'PlayerScreen',
    name: 'PlayerScreen',
    params: {
      streamUrl: episodes[index].streamUrl,
      title: episodes[index].title,
      type: 'series',
      contentId: episodes[index].id,
      seriesId: '999',
      seasonNumber: 1,
      episodeNumber: episodes[index].episodeNumber,
      seriesEpisodes: episodes,
    },
  }) as unknown as PlayerScreenProps['route'];

const movieRoute = {
  key: 'PlayerScreen',
  name: 'PlayerScreen',
  params: {
    streamUrl: 'http://server.com/movie/user/pass/10.mp4',
    title: 'Interstellar',
    type: 'movie',
    contentId: '10',
  },
} as unknown as PlayerScreenProps['route'];

const castValue = (overrides: Partial<ICastContextData> = {}): ICastContextData => ({
  isCasting: true,
  isPlaying: true,
  isPaused: false,
  isBuffering: false,
  streamPosition: 0,
  streamDuration: 0,
  castMedia: jest.fn().mockResolvedValue(undefined),
  play: jest.fn(),
  pause: jest.fn(),
  seek: jest.fn(),
  stopCast: jest.fn(),
  showExpandedControls: jest.fn(),
  currentMedia: null,
  mediaStatus: null,
  ...overrides,
});

const tree = (value: ICastContextData, route: PlayerScreenProps['route']) => (
  <NavigationContainer>
    <ThemeProvider theme={theme}>
      <CastContext.Provider value={value}>
        <PlayerScreen navigation={mockNavigation} route={route} />
      </CastContext.Provider>
    </ThemeProvider>
  </NavigationContainer>
);

describe('PlayerScreen while casting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not open the stream on the phone while the TV is playing it', () => {
    render(tree(castValue(), movieRoute));

    const sources = (useVideoPlayer as jest.Mock).mock.calls.map(([source]) => source);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((source) => source === null)).toBe(true);
  });

  it('opens the stream on the phone when not casting', () => {
    render(tree(castValue({ isCasting: false }), movieRoute));

    expect(useVideoPlayer).toHaveBeenLastCalledWith(
      expect.objectContaining({ uri: 'http://server.com/movie/user/pass/10.mp4' }),
      expect.any(Function)
    );
  });

  it('ignores the end of the previous episode right after switching episodes', () => {
    const value = castValue({
      streamPosition: 2580,
      streamDuration: 2584,
      mediaStatus: { playerState: 'playing', mediaInfo: { customData: { id: '101' } } },
    });

    render(tree(value, episodeRoute(1)));

    expect(value.castMedia).toHaveBeenCalledWith(expect.objectContaining({ contentId: '102' }));
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it('advances to the next episode when the TV reaches the end of this one', () => {
    const value = castValue({
      streamPosition: 2580,
      streamDuration: 2584,
      mediaStatus: { playerState: 'playing', mediaInfo: { customData: { id: '101' } } },
    });

    render(tree(value, episodeRoute(0)));

    expect(mockNavigation.replace).toHaveBeenCalledWith(
      'PlayerScreen',
      expect.objectContaining({ contentId: '102' })
    );
  });

  it('retries on the TV once by itself and then shows the error with a retry button', () => {
    jest.useFakeTimers();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const castMedia = jest.fn().mockResolvedValue(undefined);
    const failed = castValue({
      castMedia,
      isPlaying: false,
      mediaStatus: { playerState: 'idle', idleReason: 'error', mediaInfo: { customData: { id: '10' } } },
    });

    const screen = render(tree(failed, movieRoute));
    expect(castMedia).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(castMedia).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Erro na Transmissão na TV')).toBeNull();

    // O novo carregamento também falha na TV
    screen.rerender(tree(castValue({ castMedia, isPlaying: false, mediaStatus: null }), movieRoute));
    screen.rerender(tree(failed, movieRoute));

    expect(screen.getByText('Erro na Transmissão na TV')).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('Tentar Novamente na TV'));
    expect(castMedia).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Erro na Transmissão na TV')).toBeNull();
    alertSpy.mockRestore();
  });

  it('does not reload on the TV when it recovered before the retry', () => {
    jest.useFakeTimers();
    const castMedia = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      tree(
        castValue({
          castMedia,
          isPlaying: false,
          mediaStatus: { playerState: 'idle', idleReason: 'error', mediaInfo: { customData: { id: '10' } } },
        }),
        movieRoute
      )
    );
    expect(castMedia).toHaveBeenCalledTimes(1);

    screen.rerender(
      tree(
        castValue({
          castMedia,
          streamPosition: 5,
          streamDuration: 6000,
          mediaStatus: { playerState: 'playing', mediaInfo: { customData: { id: '10' } } },
        }),
        movieRoute
      )
    );
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(castMedia).toHaveBeenCalledTimes(1);
  });
});
