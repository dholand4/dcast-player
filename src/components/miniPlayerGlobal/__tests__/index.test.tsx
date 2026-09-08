import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { MiniPlayerGlobal } from '../index';
import { CastContext, ICastContextData } from '../../../providers/CastProvider';
import { navigationRef } from '../../../routes/navigationRef';

const mockNavigate = jest.fn();

jest.mock('../../../routes/navigationRef', () => ({
  navigationRef: {
    isReady: () => true,
    getCurrentRoute: () => ({ name: 'HomeScreen' }),
    addListener: jest.fn(() => () => {}),
    navigate: (...args: any[]) => mockNavigate(...args),
  },
}));

describe('MiniPlayerGlobal', () => {
  const mockPlay = jest.fn();
  const mockPause = jest.fn();
  const mockStopCast = jest.fn();

  const baseCastContext: ICastContextData = {
    isCasting: true,
    isPlaying: true,
    isPaused: false,
    isBuffering: false,
    streamPosition: 45,
    streamDuration: 120,
    castMedia: jest.fn(),
    play: mockPlay,
    pause: mockPause,
    seek: jest.fn(),
    stopCast: mockStopCast,
    showExpandedControls: jest.fn(),
    currentMedia: {
      streamUrl: 'http://server.com/movie.mp4',
      title: 'Filme Legal',
      type: 'movie',
      contentId: '123',
    },
  };

  const wrap = (contextValue: ICastContextData = baseCastContext) =>
    render(
      <NavigationContainer>
        <ThemeProvider theme={theme}>
          <CastContext.Provider value={contextValue}>
            <MiniPlayerGlobal />
          </CastContext.Provider>
        </ThemeProvider>
      </NavigationContainer>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mini player when casting with active media', () => {
    const { getByTestId, getByText } = wrap();

    expect(getByTestId('mini-player-global')).toBeTruthy();
    expect(getByText('Filme Legal')).toBeTruthy();
    expect(getByText('Transmitindo na TV')).toBeTruthy();
  });

  it('does not render when not casting', () => {
    const { queryByTestId } = wrap({
      ...baseCastContext,
      isCasting: false,
    });

    expect(queryByTestId('mini-player-global')).toBeNull();
  });

  it('toggles pause when play-pause button is pressed while playing', () => {
    const { getByTestId } = wrap();

    const btn = getByTestId('mini-player-play-pause-btn');
    fireEvent.press(btn);

    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('calls stopCast when close button is pressed', () => {
    const { getByTestId } = wrap();

    const closeBtn = getByTestId('mini-player-stop-btn');
    fireEvent.press(closeBtn);

    expect(mockStopCast).toHaveBeenCalledTimes(1);
  });

  it('navigates to PlayerScreen when clicking the player row', () => {
    const { getByLabelText } = wrap();

    const row = getByLabelText(/Reproduzindo Filme Legal/);
    fireEvent.press(row);

    expect(mockNavigate).toHaveBeenCalledWith('PlayerScreen', expect.objectContaining({
      title: 'Filme Legal',
      contentId: '123',
    }));
  });
});
