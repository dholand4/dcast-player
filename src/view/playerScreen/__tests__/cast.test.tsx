import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { useVideoPlayer } from 'expo-video';
import { theme } from '../../../constants/theme';
import { PlayerScreen } from '../index';
import { CastContext, ICastContextData } from '../../../providers/CastProvider';
import { AuthContext } from '../../../providers/AuthProvider';
import { xtreamService } from '../../../services/xtreamService';
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

  it('keeps the stream open on the phone while the TV is playing it', () => {
    render(tree(castValue(), movieRoute));

    const sources = (useVideoPlayer as jest.Mock).mock.calls.map(([source]) => source);
    expect(sources.length).toBeGreaterThan(0);
    expect(
      sources.every((source) => source?.uri === 'http://server.com/movie/user/pass/10.mp4')
    ).toBe(true);
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

  it('retries on the TV a few times by itself and then shows the error with a retry button', () => {
    jest.useFakeTimers();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const castMedia = jest.fn().mockResolvedValue(undefined);
    const failed = castValue({
      castMedia,
      isPlaying: false,
      mediaStatus: { playerState: 'idle', idleReason: 'error', mediaInfo: { customData: { id: '10' } } },
    });
    const loading = castValue({ castMedia, isPlaying: false, mediaStatus: null });

    const screen = render(tree(failed, movieRoute));
    expect(castMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByText('A TV não abriu o vídeo. Tentando de novo (1 de 3)…')).toBeTruthy();

    // Cada nova tentativa também falha na TV
    [5000, 10000, 20000].forEach((delay, index) => {
      act(() => {
        jest.advanceTimersByTime(delay);
      });
      expect(castMedia).toHaveBeenCalledTimes(index + 2);
      expect(screen.queryByText('Erro na Transmissão na TV')).toBeNull();
      screen.rerender(tree(loading, movieRoute));
      screen.rerender(tree(failed, movieRoute));
    });

    const reason = 'A TV começou a abrir o vídeo, mas parou com erro.';
    expect(screen.getByText('Erro na Transmissão na TV')).toBeTruthy();
    expect(screen.getByText(reason)).toBeTruthy();
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Erro na Transmissão', reason);

    fireEvent.press(screen.getByText('Tentar Novamente na TV'));
    expect(castMedia).toHaveBeenCalledTimes(5);
    expect(screen.queryByText('Erro na Transmissão na TV')).toBeNull();
    alertSpy.mockRestore();
  });

  it('shows why the TV refused the video and how many IPTV connections are in use', async () => {
    jest.useFakeTimers();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const authSpy = jest
      .spyOn(xtreamService, 'authenticate')
      .mockResolvedValue({ user_info: { active_cons: '1', max_connections: '1' } } as any);
    const castMedia = jest.fn().mockRejectedValue(new Error('FAILED'));
    const auth = {
      account: { serverUrl: 'http://server.com', username: 'user', password: 'pass' },
      loginWithM3u: jest.fn(),
    } as any;

    render(
      <AuthContext.Provider value={auth}>{tree(castValue({ castMedia, isPlaying: false }), movieRoute)}</AuthContext.Provider>
    );
    await act(async () => {});
    for (const delay of [5000, 10000, 20000]) {
      await act(async () => {
        jest.advanceTimersByTime(delay);
      });
    }

    expect(castMedia).toHaveBeenCalledTimes(4);
    expect(alertSpy).toHaveBeenCalledWith(
      'Erro na Transmissão',
      'A TV recusou o vídeo (FAILED). Lista IPTV: 1 de 1 conexão em uso.'
    );
    authSpy.mockRestore();
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
      jest.advanceTimersByTime(5000);
    });

    expect(castMedia).toHaveBeenCalledTimes(1);
  });

  it('shows the next episode card on the TV screen in the last seconds', () => {
    const value = castValue({
      streamPosition: 2560,
      streamDuration: 2584,
      mediaStatus: { playerState: 'playing', mediaInfo: { customData: { id: '101' } } },
    });

    const screen = render(tree(value, episodeRoute(0)));

    expect(screen.getByTestId('next-episode-card')).toBeTruthy();
    expect(screen.getByText('Próximo em 14s')).toBeTruthy();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it('does not switch episodes on the TV after the viewer cancels the card', () => {
    // Fora da janela de 15s entre trocas automáticas de outros testes
    jest.useFakeTimers({ now: Date.now() + 60000 });
    const playing = (position: number) =>
      castValue({
        streamPosition: position,
        streamDuration: 2584,
        mediaStatus: { playerState: 'playing', mediaInfo: { customData: { id: '101' } } },
      });

    const screen = render(tree(playing(2560), episodeRoute(0)));
    fireEvent.press(screen.getByTestId('next-episode-cancel-btn'));
    screen.rerender(tree(playing(2580), episodeRoute(0)));

    expect(screen.queryByTestId('next-episode-card')).toBeNull();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});
