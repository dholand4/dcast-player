import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
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
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';
import { calculatePercentage } from '../utils/formatters';

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
  currentMedia: ICastMediaParams | null;
}

export const CastContext = createContext<ICastContextData>({} as ICastContextData);

const isNativeCastModulePresent = Boolean(
  NativeModules.RNGoogleCast || NativeModules.RNGCSessionManager || NativeModules.RNGCCastContext
);

export const CastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const castSession = isNativeCastModulePresent ? useCastSession() : null;
  const hookClient = isNativeCastModulePresent ? useRemoteMediaClient() : null;
  const hookMediaStatus = isNativeCastModulePresent ? useMediaStatus() : null;
  const castState = isNativeCastModulePresent ? useCastState() : null;

  const [isStoppingCast, setIsStoppingCast] = useState(false);

  // Fallback client instantiated once for direct native invocation
  const fallbackClientRef = useRef<RemoteMediaClient | null>(null);
  if (isNativeCastModulePresent && !fallbackClientRef.current) {
    try {
      fallbackClientRef.current = new RemoteMediaClient();
    } catch {
      // ignore
    }
  }

  // Reset isStoppingCast when native session is truly gone
  useEffect(() => {
    if (!castSession && castState !== CastState.CONNECTED) {
      setIsStoppingCast(false);
    }
  }, [castSession, castState]);

  // Active client: hookClient or session client or fallback client
  const client = hookClient || (castSession as any)?.client || fallbackClientRef.current;

  // Connected state: session exists OR castState is connected, unless explicitly stopping
  const isCasting =
    (Boolean(castSession) || castState === CastState.CONNECTED) && !isStoppingCast;

  const [mediaStatus, setMediaStatus] = useState<any>(null);
  const [livePosition, setLivePosition] = useState<number>(0);
  const [liveDuration, setLiveDuration] = useState<number>(0);
  const [currentMedia, setCurrentMedia] = useState<ICastMediaParams | null>(() => {
    try {
      return storageService.getActiveCastMedia();
    } catch {
      return null;
    }
  });

  // Limpeza de mídia se o Cast não estiver conectado
  useEffect(() => {
    if (!isCasting) {
      storageService.clearActiveCastMedia();
      setCurrentMedia(null);
    }
  }, [isCasting]);

  // Sync with hook media status
  useEffect(() => {
    if (hookMediaStatus) {
      setMediaStatus(hookMediaStatus);
    }
  }, [hookMediaStatus]);

  // Subscribe to client events directly for reliability
  useEffect(() => {
    if (!client || !isCasting) {
      setMediaStatus(null);
      setLivePosition(0);
      setLiveDuration(0);
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

  // Recuperação e sincronização automática da mídia ativa no Chromecast (estilo Netflix)
  useEffect(() => {
    if (!isCasting) return;
    const info = activeMediaStatus?.mediaInfo;
    if (!info) return;

    setCurrentMedia((prev) => {
      const custom = info.customData || {};
      const metadata = info.metadata || {};
      const streamUrl = custom.streamUrl || info.contentUrl || info.contentId || prev?.streamUrl || '';
      const title = custom.title || metadata.title || prev?.title || 'Transmitindo na TV';
      const posterUrl = custom.posterUrl || metadata.images?.[0]?.url || prev?.posterUrl;
      const type = (custom.type || prev?.type || 'movie') as 'live' | 'movie' | 'series';
      const contentId = String(custom.id || custom.contentId || prev?.contentId || '');

      if (!streamUrl && !title) return prev;

      const restored: ICastMediaParams = {
        streamUrl,
        title,
        posterUrl,
        type,
        contentId,
        seriesId: custom.seriesId ? String(custom.seriesId) : prev?.seriesId,
        seasonNumber: custom.seasonNumber ?? prev?.seasonNumber,
        episodeNumber: custom.episodeNumber ?? prev?.episodeNumber,
      };

      storageService.saveActiveCastMedia(restored);
      return restored;
    });
  }, [isCasting, activeMediaStatus]);
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
      percentage: percentage >= 95 ? 100 : percentage,
      updatedAt: Date.now(),
      streamUrl: data.streamUrl,
    });
  }, [isCasting, streamPosition, streamDuration, activeMediaStatus]);

  const castMedia = useCallback(
    async (params: ICastMediaParams) => {
      if (!client || isStoppingCast) {
        throw new Error('Nenhum dispositivo Cast conectado.');
      }

      // 1. URL formatting: Chromecast does not support bare .ts live streams over HTTP.
      // Live IPTV streams must be passed as .m3u8 (HLS) to Chromecast receiver.
      let contentUrl = params.streamUrl;
      if (params.type === 'live') {
        contentUrl = contentUrl.replace(/\.ts(\?|$)/i, '.m3u8$1');
      }

      // 2. MIME type selection
      let contentType = 'video/mp4';
      if (params.type === 'live' || contentUrl.includes('.m3u8')) {
        contentType = 'application/x-mpegURL';
      } else if (contentUrl.includes('.mkv')) {
        contentType = 'video/x-matroska';
      } else if (contentUrl.includes('.webm')) {
        contentType = 'video/webm';
      }

      // 3. Stream type selection
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

      // CRITICAL: For live streams, startTime MUST be undefined (omitted) so the Chromecast
      // receiver starts playing from the live edge rather than seeking to 0:00:00 of a sliding window.
      if (params.type !== 'live' && params.initialTime && params.initialTime > 0) {
        loadRequest.startTime = params.initialTime;
      }

      await client.loadMedia(loadRequest);
      setCurrentMedia(params);
      storageService.saveActiveCastMedia(params);
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
    setIsStoppingCast(true);
    setCurrentMedia(null);
    storageService.clearActiveCastMedia();
    setMediaStatus(null);
    setLivePosition(0);
    setLiveDuration(0);
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

  return (
    <CastContext.Provider
      value={{
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
      }}
    >
      {children}
    </CastContext.Provider>
  );
};
