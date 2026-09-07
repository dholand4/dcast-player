import { useCallback, useEffect } from 'react';
import { NativeModules } from 'react-native';
import GoogleCast, {
  useCastSession,
  useRemoteMediaClient,
  useMediaStatus,
  SessionManager,
} from 'react-native-google-cast';
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';
import { calculatePercentage } from '../utils/formatters';

interface ICastMediaParams {
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

const isNativeCastModulePresent = Boolean(NativeModules.RNGoogleCast);

export function useCast() {
  const castSession = isNativeCastModulePresent ? useCastSession() : null;
  const client = isNativeCastModulePresent ? useRemoteMediaClient() : null;
  const mediaStatus = isNativeCastModulePresent ? useMediaStatus() : null;

  const isCasting = castSession !== null;
  const isPlaying = mediaStatus?.playerState === 'playing';
  const isPaused = mediaStatus?.playerState === 'paused';
  const isBuffering = mediaStatus?.playerState === 'buffering';
  const streamPosition = mediaStatus?.streamPosition ?? 0;
  const streamDuration = mediaStatus?.mediaInfo?.streamDuration ?? 0;

  // Persist progress while casting
  useEffect(() => {
    if (!isCasting || !mediaStatus?.mediaInfo?.customData) return;

    const data = mediaStatus.mediaInfo.customData as Partial<IWatchProgress>;
    if (!data.id || !data.type) return;

    const currentTime = Math.floor(streamPosition);
    const duration = Math.floor(streamDuration);
    const percentage = calculatePercentage(currentTime, duration);

    storageService.saveWatchProgress({
      id: data.id,
      seriesId: data.seriesId,
      title: data.title || 'Mídia transmitida',
      posterUrl: data.posterUrl || '',
      type: data.type,
      seasonNumber: data.seasonNumber,
      episodeNumber: data.episodeNumber,
      currentTime,
      duration,
      percentage,
      updatedAt: Date.now(),
      streamUrl: data.streamUrl,
    });
  }, [isCasting, streamPosition, streamDuration, mediaStatus]);

  const castMedia = useCallback(
    async (params: ICastMediaParams) => {
      if (!client) {
        throw new Error('Nenhum dispositivo Cast conectado.');
      }

      const contentType =
        params.type === 'live' ? 'application/x-mpegURL' : 'video/mp4';

      await client.loadMedia({
        mediaInfo: {
          contentUrl: params.streamUrl,
          contentType,
          metadata: {
            type: params.type === 'movie' || params.type === 'series' ? 'movie' : 'generic',
            title: params.title,
            images: params.posterUrl ? [{ url: params.posterUrl }] : [],
          },
          streamDuration: 0,
          customData: {
            id: params.contentId,
            seriesId: params.seriesId,
            title: params.title,
            posterUrl: params.posterUrl,
            type: params.type,
            seasonNumber: params.seasonNumber,
            episodeNumber: params.episodeNumber,
            streamUrl: params.streamUrl,
          },
        },
        startTime: params.initialTime && params.initialTime > 0 ? params.initialTime : 0,
        autoplay: true,
      });
    },
    [client]
  );

  const play = useCallback(() => {
    client?.play();
  }, [client]);

  const pause = useCallback(() => {
    client?.pause();
  }, [client]);

  const seek = useCallback(
    (positionSeconds: number) => {
      client?.seek({ position: positionSeconds });
    },
    [client]
  );

  const stopCast = useCallback(() => {
    client?.stop();
    if (isNativeCastModulePresent) {
      GoogleCast.getSessionManager().endCurrentSession(true);
    }
  }, [client]);

  const showExpandedControls = useCallback(() => {
    GoogleCast.showExpandedControls();
  }, []);

  return {
    isCasting,
    isPlaying,
    isPaused,
    isBuffering,
    streamPosition,
    streamDuration,
    castMedia,
    play,
    pause,
    seek,
    stopCast,
    showExpandedControls,
  };
}
