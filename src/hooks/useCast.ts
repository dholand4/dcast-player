import { useContext, useCallback, useEffect, useState, useRef } from 'react';
import { NativeModules } from 'react-native';
import GoogleCast, {
  useCastSession,
  useRemoteMediaClient,
  useMediaStatus,
  useCastState,
  CastState,
  RemoteMediaClient,
  MediaStreamType,
} from 'react-native-google-cast';
import { CastContext, ICastContextData, ICastMediaParams } from '../providers/CastProvider';
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';
import { calculatePercentage } from '../utils/formatters';

export type { ICastMediaParams, ICastContextData };

const isNativeCastModulePresent = Boolean(
  NativeModules.RNGoogleCast || NativeModules.RNGCSessionManager || NativeModules.RNGCCastContext
);

export function useCast(): ICastContextData {
  const context = useContext(CastContext);
  if (context && typeof context.isCasting === 'boolean') {
    return context;
  }

  // Fallback implementation if called outside CastProvider (e.g. standalone test)
  return useLocalCastFallback();
}

function useLocalCastFallback(): ICastContextData {
  const castSession = isNativeCastModulePresent ? useCastSession() : null;
  const hookClient = isNativeCastModulePresent ? useRemoteMediaClient() : null;
  const hookMediaStatus = isNativeCastModulePresent ? useMediaStatus() : null;
  const castState = isNativeCastModulePresent ? useCastState() : null;

  const fallbackClientRef = useRef<RemoteMediaClient | null>(null);
  if (isNativeCastModulePresent && !fallbackClientRef.current) {
    try {
      fallbackClientRef.current = new RemoteMediaClient();
    } catch {
      // ignore
    }
  }

  const client = hookClient || (castSession as any)?.client || fallbackClientRef.current;
  const isCasting = Boolean(castSession) || castState === CastState.CONNECTED;

  const [mediaStatus, setMediaStatus] = useState<any>(null);
  const [livePosition, setLivePosition] = useState<number>(0);
  const [liveDuration, setLiveDuration] = useState<number>(0);
  const [currentMedia, setCurrentMedia] = useState<ICastMediaParams | null>(null);

  useEffect(() => {
    if (hookMediaStatus) {
      setMediaStatus(hookMediaStatus);
    }
  }, [hookMediaStatus]);

  useEffect(() => {
    if (!client || !isCasting) {
      setMediaStatus(null);
      setLivePosition(0);
      setLiveDuration(0);
      setCurrentMedia(null);
      return;
    }

    client.getMediaStatus?.()?.then((status: any) => {
      if (status) setMediaStatus(status);
    })?.catch(() => {});

    const statusSub = client.onMediaStatusUpdated?.((status: any) => {
      if (status) setMediaStatus(status);
    });

    const progressSub = client.onMediaProgressUpdated?.((pos: number, dur: number) => {
      if (typeof pos === 'number' && !isNaN(pos)) setLivePosition(pos);
      if (typeof dur === 'number' && !isNaN(dur)) setLiveDuration(dur);
    }, 1);

    return () => {
      statusSub?.remove?.();
      progressSub?.remove?.();
    };
  }, [client, isCasting]);

  const activeMediaStatus = mediaStatus || hookMediaStatus;
  const isPlaying = activeMediaStatus?.playerState === 'playing';
  const isPaused = activeMediaStatus?.playerState === 'paused';
  const isBuffering = activeMediaStatus?.playerState === 'buffering';
  const streamPosition = livePosition > 0 ? livePosition : (activeMediaStatus?.streamPosition ?? 0);
  const streamDuration = liveDuration > 0 ? liveDuration : (activeMediaStatus?.mediaInfo?.streamDuration ?? 0);

  // Persist progress while casting VOD
  useEffect(() => {
    if (!isCasting || !activeMediaStatus?.mediaInfo?.customData) return;

    const data = activeMediaStatus.mediaInfo.customData as Partial<IWatchProgress>;
    if (!data.id || !data.type || data.type === 'live') return;

    const currentTime = Math.floor(streamPosition);
    const duration = Math.floor(streamDuration);
    if (currentTime <= 0 || duration <= 0) return;

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
  }, [isCasting, streamPosition, streamDuration, activeMediaStatus]);

  const castMedia = useCallback(
    async (params: ICastMediaParams) => {
      if (!client) {
        throw new Error('Nenhum dispositivo Cast conectado.');
      }

      let contentUrl = params.streamUrl;
      if (params.type === 'live') {
        contentUrl = contentUrl.replace(/\.ts(\?|$)/i, '.m3u8$1');
      }

      let contentType = 'video/mp4';
      if (params.type === 'live' || contentUrl.includes('.m3u8')) {
        contentType = 'application/x-mpegURL';
      } else if (contentUrl.includes('.mkv')) {
        contentType = 'video/x-matroska';
      } else if (contentUrl.includes('.webm')) {
        contentType = 'video/webm';
      }

      const streamType = (params.type === 'live' ? 'live' : 'buffered') as MediaStreamType;

      const mediaInfo: any = {
        contentId: contentUrl,
        contentUrl,
        contentType,
        streamType,
        metadata: {
          type:
            params.type === 'movie' || params.type === 'series'
              ? 'movie'
              : 'generic',
          title: params.title,
          images: params.posterUrl ? [{ url: params.posterUrl }] : [],
        },
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
      };

      const loadRequest: any = {
        mediaInfo,
        autoplay: true,
      };

      if (params.type !== 'live' && params.initialTime && params.initialTime > 0) {
        loadRequest.startTime = params.initialTime;
      }

      await client.loadMedia(loadRequest);
      setCurrentMedia(params);
      try {
        client.play?.();
      } catch {
        // ignore
      }
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
    setCurrentMedia(null);
    try {
      client?.stop();
    } catch {
      // ignore
    }
    if (isNativeCastModulePresent) {
      try {
        GoogleCast.getSessionManager()?.endCurrentSession(true);
      } catch {
        // ignore
      }
    }
  }, [client]);

  const showExpandedControls = useCallback(() => {
    try {
      GoogleCast.showExpandedControls();
    } catch {
      // ignore
    }
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
    currentMedia,
  };
}
