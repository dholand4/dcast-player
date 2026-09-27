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
import { CastContext, ICastContextData, ICastMediaParams, withCastTimeout } from '../providers/CastProvider';
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

  const [isStoppingCast, setIsStoppingCast] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const fallbackClientRef = useRef<RemoteMediaClient | null>(null);
  if (isNativeCastModulePresent && !fallbackClientRef.current) {
    try {
      fallbackClientRef.current = new RemoteMediaClient();
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!castSession && castState !== CastState.CONNECTED) {
      setIsStoppingCast(false);
    }
  }, [castSession, castState]);

  useEffect(() => {
    if (isStoppingCast) {
      const timer = setTimeout(() => {
        setIsStoppingCast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isStoppingCast]);

  const client = hookClient || (castSession as any)?.client || fallbackClientRef.current;
  const isCasting =
    (Boolean(castSession) || castState === CastState.CONNECTED) && !isStoppingCast;

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
      setIsMediaLoading(false);
      return;
    }

    client.getMediaStatus?.()?.then((status: any) => {
      if (status) {
        setMediaStatus(status);
        setIsMediaLoading(false);
      }
    })?.catch(() => {});

    const statusSub = client.onMediaStatusUpdated?.((status: any) => {
      if (status) {
        setMediaStatus(status);
        setIsMediaLoading(false);
      }
    });

    const endedSub = client.onMediaPlaybackEnded?.((status: any) => {
      if (status) {
        setMediaStatus(status);
        setIsMediaLoading(false);
      }
    });

    const progressSub = client.onMediaProgressUpdated?.((pos: number, dur: number) => {
      if (typeof pos === 'number' && !isNaN(pos)) setLivePosition(pos);
      if (typeof dur === 'number' && !isNaN(dur)) setLiveDuration(dur);
    }, 1);

    return () => {
      statusSub?.remove?.();
      endedSub?.remove?.();
      progressSub?.remove?.();
    };
  }, [client, isCasting]);

  // Ignorar status de mídia da sessão anterior que não pertença à mídia atual
  const isHookStatusMatchingMedia =
    !currentMedia ||
    !hookMediaStatus?.mediaInfo ||
    hookMediaStatus?.mediaInfo?.contentId === currentMedia.streamUrl ||
    hookMediaStatus?.mediaInfo?.contentUrl === currentMedia.streamUrl ||
    hookMediaStatus?.mediaInfo?.contentId?.replace(/\.m3u8$/, '.ts') === currentMedia.streamUrl ||
    hookMediaStatus?.mediaInfo?.contentUrl?.replace(/\.m3u8$/, '.ts') === currentMedia.streamUrl ||
    hookMediaStatus?.mediaInfo?.contentId?.replace(/\.mp4$/, '.mkv') === currentMedia.streamUrl ||
    hookMediaStatus?.mediaInfo?.contentUrl?.replace(/\.mp4$/, '.mkv') === currentMedia.streamUrl ||
    (hookMediaStatus?.mediaInfo?.customData as any)?.id === currentMedia.contentId;

  const validHookStatus = isHookStatusMatchingMedia ? hookMediaStatus : null;
  const activeMediaStatus = isMediaLoading ? null : (mediaStatus || validHookStatus);

  const isPlaying = !isMediaLoading && activeMediaStatus?.playerState === 'playing';
  const isPaused = !isMediaLoading && activeMediaStatus?.playerState === 'paused';
  const isBuffering = isMediaLoading || activeMediaStatus?.playerState === 'buffering';
  const streamPosition = isMediaLoading
    ? 0
    : livePosition > 0
    ? livePosition
    : (activeMediaStatus?.streamPosition ?? 0);
  const streamDuration = isMediaLoading
    ? 0
    : liveDuration > 0
    ? liveDuration
    : (activeMediaStatus?.mediaInfo?.streamDuration ?? 0);

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
      let activeClient = client;

      if (isNativeCastModulePresent) {
        for (let i = 0; i < 6; i++) {
          try {
            const curSession = await GoogleCast.getSessionManager()?.getCurrentCastSession();
            if (curSession?.client) {
              activeClient = curSession.client;
              break;
            }
          } catch {
            // ignore
          }
          if (activeClient) break;
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (!activeClient) {
        throw new Error('Nenhum dispositivo Cast conectado.');
      }

      setIsStoppingCast(false);
      setIsMediaLoading(true);
      setLivePosition(0);
      setLiveDuration(0);
      setMediaStatus(null);
      setCurrentMedia(params);

      let contentUrl = params.streamUrl;
      if (params.type === 'live') {
        contentUrl = contentUrl.replace(/\.ts(\?|$)/i, '.m3u8$1');
      } else if (params.type === 'movie' || params.type === 'series') {
        contentUrl = contentUrl.replace(/\.mkv(\?|$)/i, '.mp4$1');
      }

      let contentType = 'video/mp4';
      if (params.type === 'live' || contentUrl.includes('.m3u8')) {
        contentType = 'application/x-mpegURL';
      } else if (contentUrl.includes('.webm')) {
        contentType = 'video/webm';
      } else {
        contentType = 'video/mp4';
      }

      const streamType = (params.type === 'live' ? 'live' : 'buffered') as MediaStreamType;

      const isValidHttpUrl = (url?: string): boolean => {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://');
      };

      const cleanCustomData: Record<string, any> = {
        id: String(params.contentId || ''),
        title: params.title || '',
        type: params.type,
        streamUrl: params.streamUrl,
      };
      if (params.seriesId) cleanCustomData.seriesId = String(params.seriesId);
      if (params.posterUrl) cleanCustomData.posterUrl = params.posterUrl;
      if (typeof params.seasonNumber === 'number') cleanCustomData.seasonNumber = params.seasonNumber;
      if (typeof params.episodeNumber === 'number') cleanCustomData.episodeNumber = params.episodeNumber;

      const mediaInfo: any = {
        contentId: contentUrl,
        contentUrl,
        contentType,
        streamType,
        metadata: {
          type: 'generic',
          title: params.title || 'Transmitindo na TV',
          images: isValidHttpUrl(params.posterUrl) ? [{ url: params.posterUrl!.trim() }] : [],
        },
        customData: cleanCustomData,
      };

      const loadRequest: any = {
        mediaInfo,
        autoplay: true,
      };

      if (params.type !== 'live' && typeof params.initialTime === 'number' && Number.isFinite(params.initialTime) && params.initialTime > 2) {
        loadRequest.startTime = Math.floor(params.initialTime);
      }

      try {
        await withCastTimeout(activeClient.loadMedia(loadRequest));
        setCurrentMedia(params);
        try {
          activeClient.play?.();
        } catch {
          // ignore
        }
      } catch (loadErr) {
        // Fallback: Se o carregamento inicial falhar com startTime (ex: servidor rejeita offset 416),
        // tenta novamente do início sem startTime para garantir que o vídeo rode na TV.
        if (loadRequest.startTime) {
          console.warn('[Cast] loadMedia falhou com startTime, tentando novamente do início:', loadErr);
          delete loadRequest.startTime;
          try {
            await withCastTimeout(activeClient.loadMedia(loadRequest));
            setCurrentMedia(params);
            try {
              activeClient.play?.();
            } catch {
              // ignore
            }
            return;
          } catch (retryErr) {
            console.error('[Cast] Falha ao recarregar mídia no Chromecast:', retryErr);
            throw retryErr;
          }
        }
        throw loadErr;
      } finally {
        setTimeout(() => {
          setIsMediaLoading(false);
        }, 500);
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
    mediaStatus: activeMediaStatus,
  };
}
