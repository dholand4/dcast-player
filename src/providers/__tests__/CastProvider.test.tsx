import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useCastSession, useCastState, useMediaStatus, useRemoteMediaClient } from 'react-native-google-cast';
import { CastProvider } from '../CastProvider';
import { ProfileContext, IProfileContextData } from '../ProfileProvider';
import { storageService } from '../../services/storageService';

const profile = (id: string) => ({ id, name: id, color: '#E50914', createdAt: 0, updatedAt: 0 });

const withProfile = (activeProfileId: string | null) => (
  <ProfileContext.Provider
    value={{ activeProfile: activeProfileId ? profile(activeProfileId) : null } as IProfileContextData}
  >
    <CastProvider>{null}</CastProvider>
  </ProfileContext.Provider>
);

describe('CastProvider and profiles', () => {
  const mockStop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    storageService.setActiveProfileId('dq');
    (useCastSession as jest.Mock).mockReturnValue({ id: 'session-1' });
    (useCastState as jest.Mock).mockReturnValue('connected');
    (useMediaStatus as jest.Mock).mockReturnValue(null);
    (useRemoteMediaClient as jest.Mock).mockReturnValue({
      loadMedia: jest.fn().mockResolvedValue(undefined),
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      stop: mockStop,
      getMediaStatus: jest.fn().mockResolvedValue(null),
      onMediaStatusUpdated: jest.fn(() => ({ remove: jest.fn() })),
      onMediaProgressUpdated: jest.fn(() => ({ remove: jest.fn() })),
    });
  });

  it('stops casting when another profile is chosen', () => {
    const screen = render(withProfile('dq'));
    // Tela "Quem está assistindo?": ainda não trocou de perfil
    screen.rerender(withProfile(null));
    expect(mockStop).not.toHaveBeenCalled();

    storageService.setActiveProfileId('me');
    screen.rerender(withProfile('me'));
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('keeps casting when the same profile is chosen again', () => {
    const screen = render(withProfile('dq'));
    screen.rerender(withProfile(null));
    screen.rerender(withProfile('dq'));

    expect(mockStop).not.toHaveBeenCalled();
  });

  it('does not save the cast progress into another profile history while the TV is slow to stop', () => {
    jest.useFakeTimers();
    const saveSpy = jest.spyOn(storageService, 'saveWatchProgress');
    const statusAt = (streamPosition: number) => ({
      playerState: 'playing',
      streamPosition,
      mediaInfo: {
        streamDuration: 2400,
        customData: { id: '101', type: 'series', title: 'Ted Lasso - T1E1', seriesId: '999' },
      },
    });

    (useMediaStatus as jest.Mock).mockReturnValue(statusAt(100));
    const screen = render(withProfile('dq'));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: '101', currentTime: 100 }));
    saveSpy.mockClear();

    storageService.setActiveProfileId('me');
    screen.rerender(withProfile('me'));
    expect(mockStop).toHaveBeenCalledTimes(1);

    // A sessão com a TV ainda não acabou quando o app para de esperar (2,5s) e a TV segue mandando progresso
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    (useMediaStatus as jest.Mock).mockReturnValue(statusAt(160));
    screen.rerender(withProfile('me'));

    expect(saveSpy).not.toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalledTimes(2);
    saveSpy.mockRestore();
    jest.useRealTimers();
  });
});
