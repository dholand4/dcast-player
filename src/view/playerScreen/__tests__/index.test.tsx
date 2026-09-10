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
      currentMedia: null,
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

  it('renders EPG container and PiP button for live stream', () => {
    const liveRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/live/user/pass/1.m3u8',
        title: 'Globo HD',
        type: 'live',
        contentId: '1',
        liveChannels: [
          { id: '1', name: 'Globo HD', streamUrl: 'http://server.com/live/1.m3u8' },
          { id: '2', name: 'SBT HD', streamUrl: 'http://server.com/live/2.m3u8' },
        ],
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId, getByText } = wrap(
      <PlayerScreen navigation={mockNavigation} route={liveRoute} />
    );

    expect(getByTestId('epg-container')).toBeTruthy();
    expect(getByText('No Ar')).toBeTruthy();
    expect(getByTestId('pip-button')).toBeTruthy();
    expect(getByTestId('channel-drawer-button')).toBeTruthy();
    expect(getByTestId('epg-modal-button')).toBeTruthy();
    expect(getByTestId('settings-modal-button')).toBeTruthy();
  });

  it('opens EPG schedule modal when pressing epg button or epg container', () => {
    const liveRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/live/user/pass/1.m3u8',
        title: 'Globo HD',
        type: 'live',
        contentId: '1',
        liveChannels: [
          { id: '1', name: 'Globo HD', streamUrl: 'http://server.com/live/1.m3u8' },
        ],
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={liveRoute} />
    );

    expect(queryByTestId('epg-modal-container')).toBeNull();

    // Press top bar EPG button
    fireEvent.press(getByTestId('epg-modal-button'));
    expect(getByTestId('epg-modal-container')).toBeTruthy();

    // Close modal
    fireEvent.press(getByTestId('epg-modal-close'));
    expect(queryByTestId('epg-modal-container')).toBeNull();

    // Press bottom EPG container
    fireEvent.press(getByTestId('epg-container'));
    expect(getByTestId('epg-modal-container')).toBeTruthy();
  });

  it('opens channel drawer and allows channel switching', () => {
    const liveRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/live/user/pass/1.m3u8',
        title: 'Globo HD',
        type: 'live',
        contentId: '1',
        liveChannels: [
          { id: '1', name: 'Globo HD', streamUrl: 'http://server.com/live/1.m3u8' },
          { id: '2', name: 'SBT HD', streamUrl: 'http://server.com/live/2.m3u8' },
        ],
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId, getByText, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={liveRoute} />
    );

    expect(queryByTestId('channel-drawer')).toBeNull();

    fireEvent.press(getByTestId('channel-drawer-button'));
    expect(getByTestId('channel-drawer')).toBeTruthy();
    expect(getByText('SBT HD')).toBeTruthy();

    fireEvent.press(getByText('SBT HD'));
    expect(queryByTestId('channel-drawer')).toBeNull();
  });

  it('opens settings modal and allows speed adjustment', () => {
    const { getByTestId, getByText, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(queryByTestId('settings-modal-backdrop')).toBeNull();

    fireEvent.press(getByTestId('settings-modal-button'));
    expect(getByTestId('settings-modal-backdrop')).toBeTruthy();
    expect(getByText('Ajustes de Reprodução')).toBeTruthy();
    expect(getByText('Velocidade de Reprodução')).toBeTruthy();

    fireEvent.press(getByText('1.5x'));
    expect(getByText('1.5x')).toBeTruthy();
  });

  it('handles screen lock and unlocking', () => {
    const { getByTestId, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const lockBtn = getByTestId('lock-screen-button');
    expect(lockBtn).toBeTruthy();

    // Lock screen
    fireEvent.press(lockBtn);
    expect(getByTestId('lock-screen-backdrop')).toBeTruthy();
    expect(queryByTestId('player-back-button')).toBeNull();

    // Touch screen to show unlock button
    fireEvent.press(getByTestId('lock-screen-backdrop'));
    const unlockBtn = getByTestId('unlock-screen-button');
    expect(unlockBtn).toBeTruthy();

    // Unlock screen
    fireEvent.press(unlockBtn);
    expect(queryByTestId('lock-screen-backdrop')).toBeNull();
  });

  it('configures sleep timer and displays sleep timer badge', () => {
    const { getByTestId, getByText, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(queryByTestId('sleep-timer-badge')).toBeNull();

    // Open settings modal
    fireEvent.press(getByTestId('settings-modal-button'));
    expect(getByText('Temporizador para Dormir')).toBeTruthy();

    // Select 15 min
    fireEvent.press(getByTestId('sleep-timer-btn-15'));

    // Close modal
    fireEvent.press(getByTestId('settings-modal-backdrop'));

    // Badge should now be visible
    expect(getByTestId('sleep-timer-badge')).toBeTruthy();
  });

  it('cycles and selects aspect ratio content fit modes', () => {
    const { getByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const aspectBtn = getByTestId('aspect-ratio-button');
    expect(aspectBtn).toBeTruthy();

    // Cycle through modes
    fireEvent.press(aspectBtn); // to cover
    fireEvent.press(aspectBtn); // to fill
    fireEvent.press(aspectBtn); // to contain

    // Open settings modal to select mode
    fireEvent.press(getByTestId('settings-modal-button'));
    const fillBtn = getByTestId('content-fit-btn-fill');
    expect(fillBtn).toBeTruthy();
    fireEvent.press(fillBtn);
  });

  it('handles double tap to seek and displays visual feedback ripple', () => {
    const { getByTestId, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const bgTouch = getByTestId('video-background-touch');

    // First tap on right side (locationX: 700 is > 60% of default 750 screen width)
    fireEvent(bgTouch, 'press', { nativeEvent: { locationX: 700 } });
    // Second tap on right side within 300ms
    fireEvent(bgTouch, 'press', { nativeEvent: { locationX: 700 } });

    expect(queryByTestId('double-tap-feedback-container')).toBeTruthy();
  });

  it('interacts with volume controls and expands volume slider', () => {
    const { getByTestId, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />
    );

    const muteBtn = getByTestId('player-mute-button');
    expect(muteBtn).toBeTruthy();

    // Toggle mute
    fireEvent.press(muteBtn);

    // Long press to toggle slider on mobile
    fireEvent(muteBtn, 'longPress');

    // If slider is visible, adjust volume
    const sliderTouch = queryByTestId('volume-slider-touch');
    if (sliderTouch) {
      fireEvent(sliderTouch, 'press', { nativeEvent: { locationX: 50 } });
    }
  });

  it('shows timeline preview tooltip when scrubbing progress bar on VOD', () => {
    const movieRoute = {
      key: 'PlayerScreen',
      name: 'PlayerScreen',
      params: {
        streamUrl: 'http://server.com/movie/user/pass/1.mp4',
        title: 'Interestelar',
        type: 'movie',
        contentId: '10',
      },
    } as unknown as PlayerScreenProps['route'];

    const { getByTestId, queryByTestId } = wrap(
      <PlayerScreen navigation={mockNavigation} route={movieRoute} />
    );

    const progressBar = getByTestId('player-progress-bar');
    expect(progressBar).toBeTruthy();

    // Move pointer over progress bar
    fireEvent(progressBar, 'pointerMove', {
      nativeEvent: { locationX: 120, clientX: 120 },
    });

    expect(queryByTestId('timeline-preview-tooltip')).toBeTruthy();
  });
});


