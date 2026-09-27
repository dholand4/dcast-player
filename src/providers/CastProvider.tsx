import React, { createContext, useState, useCallback, useEffect, ReactNode, useRef, useContext } from 'react';
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
import { ProfileContext } from './ProfileProvider';

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
  mediaStatus?: any;
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
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  // Perfil que iniciou a transmissão: o progresso dela vai só para o histórico dele
  const { activeProfile } = useContext(ProfileContext);
  const activeProfileId = activeProfile?.id ?? null;
  const castOwnerProfileRef = useRef<string | null>(null);

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
      // Só aqui a transmissão deixa de ter dono: enquanto a TV encerra, ela ainda é do perfil anterior
      castOwnerProfileRef.current = null;
    }
  }, [castSession, castState]);

  // Safety timeout: reset isStoppingCast after 2.5s to avoid permanently locking the player
  useEffect(() => {
    if (isStoppingCast) {
      const timer = setTimeout(() => {
        setIsStoppingCast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isStoppingCast]);

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
      setIsMediaLoading(false);
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

  // Ignorar status de mídia retido da sessão/episódio anterior que não pertença à mídia atual
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

  // Recuperação e sincronização automática da mídia ativa no Chromecast (estilo Netflix)
  useEffect(() => {
    if (!isCasting) return;
    const info = activeMediaStatus?.mediaInfo;
    if (!info) return;

    // Do NOT restore or overwrite if the media has finished
    if (
      activeMediaStatus?.playerState === 'idle' &&
      (activeMediaStatus?.idleReason === 'finished' || activeMediaStatus?.idleReason === 1)
    ) {
      return;
    }

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
    if (castOwnerProfileRef.current && storageService.getActiveProfileId() !== castOwnerProfileRef.current) {
      return;
    }

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
      let activeClient = client;

      // Resolução resiliente da sessão nativa do Cast
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
      castOwnerProfileRef.current = storageService.getActiveProfileId();
      setIsMediaLoading(true);
      // Reset position, duration and status immediately so stale data never triggers auto-advance loops
      setLivePosition(0);
      setLiveDuration(0);
      setMediaStatus(null);
      setCurrentMedia(params);
      storageService.saveActiveCastMedia(params);

      // 1. URL formatting:
      // a) Chromecast does not support bare .ts live streams over HTTP.
      //    Live IPTV streams must be passed as .m3u8 (HLS) to Chromecast receiver.
      // b) Chromecast Default Media Receiver (CC1AD845) does not support .mkv containers.
      //    IPTV servers (Xtream Codes) serve VOD with video/mp4 when requested with .mp4 extension.
      let contentUrl = params.streamUrl;
      if (params.type === 'live') {
        contentUrl = contentUrl.replace(/\.ts(\?|$)/i, '.m3u8$1');
      } else if (params.type === 'movie' || params.type === 'series') {
        contentUrl = contentUrl.replace(/\.mkv(\?|$)/i, '.mp4$1');
      }

      // 2. MIME type selection
      // Note: Google Cast Default Media Receiver (CC1AD845) rejects video/x-matroska with MEDIA_ERR_SRC_NOT_SUPPORTED.
      // MKV and MP4 IPTV streams must be treated as video/mp4 so the HTML5/MSE receiver processes the stream.
      let contentType = 'video/mp4';
      if (params.type === 'live' || contentUrl.includes('.m3u8')) {
        contentType = 'application/x-mpegURL';
      } else if (contentUrl.includes('.webm')) {
        contentType = 'video/webm';
      } else {
        contentType = 'video/mp4';
      }

      // 3. Stream type selection
      const streamType = (params.type === 'live' ? 'live' : 'buffered') as MediaStreamType;

      // 4. Poster URL validation (Android WebImage requires valid http/https)
      const isValidHttpUrl = (url?: string): boolean => {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://');
      };

      // 5. Clean customData (remove any undefined or null fields before passing across bridge)
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

      // CRITICAL: For live streams, startTime MUST be undefined (omitted) so the Chromecast
      // receiver starts playing from the live edge rather than seeking to 0:00:00 of a sliding window.
      if (params.type !== 'live' && typeof params.initialTime === 'number' && Number.isFinite(params.initialTime) && params.initialTime > 2) {
        loadRequest.startTime = Math.floor(params.initialTime);
      }

      try {
        await activeClient.loadMedia(loadRequest);
        setCurrentMedia(params);
        storageService.saveActiveCastMedia(params);
        try {
          activeClient.play?.();
        } catch {
          // ignore
        }
      } catch (loadErr) {
        // Fallback: If initial load failed with startTime (e.g. server rejects initial Range offset with 416),
        // retry loading from the beginning without startTime so playback is guaranteed to start on TV.
        if (loadRequest.startTime) {
          console.warn('[Cast] loadMedia falhou com startTime, tentando novamente do início:', loadErr);
          delete loadRequest.startTime;
          try {
            await activeClient.loadMedia(loadRequest);
            setCurrentMedia(params);
            storageService.saveActiveCastMedia(params);
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

  // Trocar para outro perfil encerra a transmissão do anterior; voltar ao mesmo perfil não
  useEffect(() => {
    if (!isCasting || !activeProfileId) return;
    if (!castOwnerProfileRef.current) {
      castOwnerProfileRef.current = activeProfileId;
      return;
    }
    if (castOwnerProfileRef.current !== activeProfileId) {
      stopCast();
    }
  }, [isCasting, activeProfileId, stopCast]);

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
        mediaStatus: activeMediaStatus,
      }}
    >
      {children}
    </CastContext.Provider>
  );
};
