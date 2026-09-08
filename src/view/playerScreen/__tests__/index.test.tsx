import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { PlayerScreen } from '../index';
import { CastContext } from '../../../providers/CastProvider';

import { PlayerScreenProps } from '../../../routes/types';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
} as unknown as PlayerScreenProps['navigation'];

const mockRoute = {
  key: 'PlayerScreen',
  name: 'PlayerScreen',
  params: {
    streamUrl: 'http://server.com/live/user/pass/1.m3u8',
    title: 'Globo HD',
    type: 'live',
    contentId: '1',
  },
} as unknown as PlayerScreenProps['route'];

const wrap = (ui: React.ReactElement) =>
  render(
    <NavigationContainer>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </NavigationContainer>
  );

describe('PlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders local player with title and controls', () => {
    const { getByTestId, getByText } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByTestId('local-player-screen')).toBeTruthy();
    expect(getByText('Globo HD')).toBeTruthy();
  });

  it('handles back button press', () => {
    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('player-back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('handles mute toggle button press', () => {
    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const muteBtn = getByTestId('player-mute-button');
    expect(muteBtn).toBeTruthy();
    fireEvent.press(muteBtn);
  });

  it('handles background touch to toggle controls', () => {
    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const bgTouch = getByTestId('video-background-touch');
    expect(bgTouch).toBeTruthy();
    fireEvent.press(bgTouch);
  });

  it('renders seek and play controls for movie/vod content', () => {
    const movieRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/movie/user/pass/1.mp4',
        title: 'Interstellar',
        type: 'movie',
        contentId: '10',
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={movieRoute} />
    );

    const playPauseBtn = getByTestId('play-pause-button');
    expect(playPauseBtn).toBeTruthy();
    fireEvent.press(playPauseBtn);

    const seekBack = getByTestId('seek-back-button');
    const seekForward = getByTestId('seek-forward-button');
    expect(seekBack).toBeTruthy();
    expect(seekForward).toBeTruthy();
    fireEvent.press(seekBack);
    fireEvent.press(seekForward);

    const progressBar = getByTestId('player-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('renders next episode button and navigates to next episode in local player', () => {
    const episodes = [
      { id: '101', title: 'Breaking Bad - T1E1', streamUrl: 'http://server.com/101.mp4', seasonNumber: 1, episodeNumber: 1 },
      { id: '102', title: 'Breaking Bad - T1E2', streamUrl: 'http://server.com/102.mp4', seasonNumber: 1, episodeNumber: 2 },
    ];

    const seriesRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/101.mp4',
        title: 'Breaking Bad - T1E1',
        type: 'series',
        contentId: '101',
        seriesId: '999',
        seasonNumber: 1,
        episodeNumber: 1,
        seriesEpisodes: episodes,
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={seriesRoute} />
    );

    const nextBtn = getByTestId('next-episode-button');
    expect(nextBtn).toBeTruthy();
    fireEvent.press(nextBtn);

    expect(mockNavigation.replace).toHaveBeenCalledWith('PlayerScreen', expect.objectContaining({
      contentId: '102',
      title: 'Breaking Bad - T1E2',
      streamUrl: 'http://server.com/102.mp4',
      type: 'series',
    }));
  });

  it('renders remote container when isCasting is true with next episode support', () => {
    const episodes = [
      { id: '101', title: 'Breaking Bad - T1E1', streamUrl: 'http://server.com/101.mp4', seasonNumber: 1, episodeNumber: 1 },
      { id: '102', title: 'Breaking Bad - T1E2', streamUrl: 'http://server.com/102.mp4', seasonNumber: 1, episodeNumber: 2 },
    ];

    const castSeriesRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/101.mp4',
        title: 'Breaking Bad - T1E1',
        type: 'series',
        contentId: '101',
        seriesId: '999',
        seasonNumber: 1,
        episodeNumber: 1,
        seriesEpisodes: episodes,
      },
    } as unknown as PlayerScreenProps['route'];

    const mockCastValue = {
      isCasting: true,
      isPlaying: true,
      isPaused: false,
      isBuffering: false,
      streamPosition: 45,
      streamDuration: 180,
      castMedia: jest.fn().mockResolvedValue(undefined),
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      stopCast: jest.fn(),
      showExpandedControls: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <ThemeProvider theme={theme}>
          <CastContext.Provider value={mockCastValue}>
            <PlayerScreen navigation={mockNavigation} route={castSeriesRoute} />
          </CastContext.Provider>
        </ThemeProvider>
      </NavigationContainer>
    );

    expect(getByTestId('cast-remote-screen')).toBeTruthy();
    expect(getByText('Transmitindo na TV')).toBeTruthy();
    expect(getByText('Breaking Bad - T1E1')).toBeTruthy();

    const castNextBtn = getByTestId('cast-next-episode-button');
    expect(castNextBtn).toBeTruthy();
    fireEvent.press(castNextBtn);

    expect(mockNavigation.replace).toHaveBeenCalledWith('PlayerScreen', expect.objectContaining({
      contentId: '102',
      title: 'Breaking Bad - T1E2',
    }));
  });
});


