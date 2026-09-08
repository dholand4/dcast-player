import React, { createContext, ReactNode } from 'react';

export interface ICastMediaParams {
  streamUrl: string;
  title: string;
  posterUrl?: string;
  type: 'live' | 'movie' | 'series';
  contentId: string;
  seriesId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  initialTime?: number;
}

export interface ICastContextData {
  isCasting: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  streamPosition: number;
  streamDuration: number;
  castMedia: (params: ICastMediaParams) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (positionSeconds: number) => void;
  stopCast: () => void;
  showExpandedControls: () => void;
}

export const CastContext = createContext<ICastContextData>({
  isCasting: false,
  isPlaying: false,
  isPaused: false,
  isBuffering: false,
  streamPosition: 0,
  streamDuration: 0,
  castMedia: async () => {},
  play: () => {},
  pause: () => {},
  seek: () => {},
  stopCast: () => {},
  showExpandedControls: () => {},
});

export const CastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value: ICastContextData = {
    isCasting: false,
    isPlaying: false,
    isPaused: false,
    isBuffering: false,
    streamPosition: 0,
    streamDuration: 0,
    castMedia: async () => {},
    play: () => {},
    pause: () => {},
    seek: () => {},
    stopCast: () => {},
    showExpandedControls: () => {},
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
};
