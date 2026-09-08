import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAppInsets } from '../../hooks/useAppInsets';
import { PlayerScreenProps } from '../../routes/types';
import { useCast } from '../../hooks/useCast';
import { useAuth } from '../../hooks/useAuth';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { formatSeconds, calculatePercentage } from '../../utils/formatters';
import { xtreamService } from '../../services/xtreamService';
import { ProgressBarGlobal } from '../../components/progressBarGlobal';
import { CastButtonGlobal } from '../../components/castButtonGlobal';
import { ButtonGlobal } from '../../components/buttonGlobal';
import {
  Container,
  VideoWrapper,
  StyledVideo,
  BackgroundPressable,
  BufferingWrapper,
  ControlsOverlay,
  TopControls,
  TopRightActions,
  ControlButton,
  PlayerTitle,
  CenterControls,
  BigPlayButton,
  SeekButton,
  BottomControls,
  TimeRow,
  TimeText,
  RemoteContainer,
  RemoteTop,
  CastBadge,
  CastBadgeDot,
  CastBadgeText,
  RemoteArtworkWrapper,
  RemoteArtwork,
  RemoteInfo,
  RemoteTitle,
  RemoteSub,
  ErrorOverlay,
  ErrorBox,
  ErrorTitle,
  ErrorMessage,
  ErrorButtonGroup,
} from './style';

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  route,
  navigation,
}) => {
  const {
    streamUrl,
    title,
    posterUrl,
    type,
    contentId,
    seriesId,
    seasonNumber,
    episodeNumber,
    initialTime = 0,
    seriesEpisodes,
  } = route.params;

  const { account } = useAuth();
  const [episodesList, setEpisodesList] = useState(seriesEpisodes || []);

  useEffect(() => {
    if (seriesEpisodes && seriesEpisodes.length > 0) {
      setEpisodesList(seriesEpisodes);
    }
  }, [seriesEpisodes]);

  useEffect(() => {
    if (type === 'series' && seriesId && (!episodesList || episodesList.length === 0) && account) {
      xtreamService
        .getSeriesInfo(account, seriesId)
        .then((info) => {
          if (!info?.episodes) return;
          const epsMap = info.episodes;
          const seasons = Object.keys(epsMap).sort((a, b) => Number(a) - Number(b));
          const flatEps = seasons.flatMap((seasonKey) => {
            const eps = epsMap[seasonKey] || [];
            return eps.map((ep: any) => ({
              id: String(ep.id),
              episodeNumber: Number(ep.episode_num),
              seasonNumber: Number(seasonKey),
              title: `${info.info?.name || title} - T${seasonKey}E${ep.episode_num}: ${ep.title}`,
              streamUrl: xtreamService.buildSeriesStreamUrl(
                account,
                ep.id,
                ep.container_extension || 'mp4'
              ),
              posterUrl: ep.info?.movie_image || posterUrl,
            }));
          });
          setEpisodesList(flatEps);
        })
        .catch(() => {});
    }
  }, [type, seriesId, account, episodesList, title, posterUrl]);

  const currentEpIndex = useMemo(() => {
    if (!episodesList || episodesList.length === 0) return -1;
    return episodesList.findIndex(
      (ep) =>
        ep.id === contentId ||
        (seasonNumber && episodeNumber && ep.seasonNumber === seasonNumber && ep.episodeNumber === episodeNumber)
    );
  }, [episodesList, contentId, seasonNumber, episodeNumber]);

  const nextEpisode = useMemo(() => {
    if (currentEpIndex < 0 || currentEpIndex >= episodesList.length - 1) return null;
    return episodesList[currentEpIndex + 1];
  }, [currentEpIndex, episodesList]);

  const prevEpisode = useMemo(() => {
    if (currentEpIndex <= 0) return null;
    return episodesList[currentEpIndex - 1];
  }, [currentEpIndex, episodesList]);

  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const initialStreamUrl = useMemo(() => {
    if (Platform.OS === 'web' && type === 'live' && streamUrl.includes('.ts')) {
      return streamUrl.replace(/\.ts(\?|$)/, '.m3u8$1');
    }
    return streamUrl;
  }, [streamUrl, type]);

  const [currentStreamUrl, setCurrentStreamUrl] = useState(initialStreamUrl);
  const attemptedAlternativeRef = useRef(false);
  const hasAppliedInitialTimeRef = useRef(false);

  const videoSource = useMemo(() => {
    const isHls = currentStreamUrl.includes('.m3u8');
    return {
      uri: currentStreamUrl,
      contentType: (isHls ? 'hls' : 'auto') as any,
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        Accept: '*/*',
      },
    };
  }, [currentStreamUrl]);

  const { saveProgress } = useWatchHistory();
  const {
    isCasting,
    isPlaying: isCastPlaying,
    isPaused: isCastPaused,
    streamPosition,
    streamDuration,
    castMedia,
    play: castPlay,
    pause: castPause,
    seek: castSeek,
    stopCast,
  } = useCast();

  const isCastingRef = useRef(isCasting);
  isCastingRef.current = isCasting;
  const prevIsCastingRef = useRef(isCasting);
  const hasCastRef = useRef(false);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1.0;
    p.audioMixingMode = 'doNotMix';
    p.keepScreenOnWhilePlaying = true;
    if (type === 'live') {
      p.bufferOptions = {
        preferredForwardBufferDuration: 10,
        minBufferForPlayback: 0.5,
      };
    } else {
      p.bufferOptions = {
        preferredForwardBufferDuration: 20,
        minBufferForPlayback: 1.5,
      };
    }
    if (initialTime > 0) {
      p.currentTime = initialTime;
    }
    // Autoplay localmente apenas se NÃO estiver transmitindo para a TV
    if (!isCastingRef.current) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Local player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [contentFitMode, setContentFitMode] = useState<'contain' | 'cover'>('contain');
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const currentTimeRef = useRef(initialTime);
  const durationRef = useRef(0);
  const showControlsRef = useRef(showControls);
  showControlsRef.current = showControls;

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (currentTimeRef.current !== undefined) {
      setCurrentTime(currentTimeRef.current);
    }
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  const handleToggleMute = useCallback(() => {
    resetHideTimer();
    const nextMuted = !isMuted;
    try {
      player.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch {
      // ignore
    }
  }, [isMuted, player, resetHideTimer]);

  const handleToggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch {
      // ignore
    }
  }, []);

  // Lock orientation to landscape for local playback, restore to portrait on unmount or cast
  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function applyOrientation() {
      try {
        if (!isCasting) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch {
        // ignore on unsupported environments
      }
    }
    applyOrientation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [isCasting]);

  // Configura pré-carregamento suave de buffer e restauração de initialTime no elemento <video> do navegador (Web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let applied = false;
    const checkAndPrepareWebVideo = () => {
      const videoEl = document.querySelector('video');
      if (!videoEl) return;

      videoEl.preload = 'auto';
      videoEl.playsInline = true;
      videoEl.style.transform = 'translateZ(0)';
      (videoEl.style as any).webkitTransform = 'translateZ(0)';
      videoEl.style.willChange = 'transform';
      videoEl.style.backfaceVisibility = 'hidden';
      (videoEl.style as any).webkitBackfaceVisibility = 'hidden';

      if (initialTime > 0 && !applied && !hasAppliedInitialTimeRef.current) {
        const doSeek = () => {
          if (applied || hasAppliedInitialTimeRef.current) return;
          applied = true;
          hasAppliedInitialTimeRef.current = true;
          try {
            videoEl.currentTime = initialTime;
            player.currentTime = initialTime;
            setCurrentTime(initialTime);
          } catch (err) {
            console.warn('[Web] Erro ao buscar initialTime no elemento de vídeo:', err);
          }
        };

        if (videoEl.readyState >= 1) {
          doSeek();
        } else {
          videoEl.addEventListener('loadedmetadata', doSeek, { once: true });
          videoEl.addEventListener('canplay', doSeek, { once: true });
        }
      }
    };

    checkAndPrepareWebVideo();
    const interval = setInterval(checkAndPrepareWebVideo, 200);
    const timer = setTimeout(() => clearInterval(interval), 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [initialTime, player]);

  // Web HLS Playback Engine para Canais Ao Vivo
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const isLiveOrHls = type === 'live' || currentStreamUrl.includes('.m3u8');
    if (!isLiveOrHls) return;

    let hlsInstance: any = null;
    let pollTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const attachHls = () => {
      const videoEl = document.querySelector('video');
      if (!videoEl) {
        if (!isCancelled) {
          pollTimer = setTimeout(attachHls, 200);
        }
        return;
      }

      videoEl.preload = 'auto';
      videoEl.playsInline = true;
      videoEl.style.transform = 'translateZ(0)';
      (videoEl.style as any).webkitTransform = 'translateZ(0)';
      videoEl.style.willChange = 'transform';
      videoEl.style.backfaceVisibility = 'hidden';
      (videoEl.style as any).webkitBackfaceVisibility = 'hidden';

      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        try {
          if (hlsInstance) {
            hlsInstance.destroy();
          }

          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: false, // Desativa baixa latência agressiva que causa travamentos em IPTV
            liveSyncDurationCount: 3, // Margem de segurança de 3 chunks (~9-12s), prevenindo micro-pausas
            liveMaxLatencyDurationCount: 10, // Evita acumular atraso excessivo
            backBufferLength: 30, // Descarrega chunks antigos da RAM para manter o navegador leve
            maxBufferLength: 30, // Mantém até 30s de buffer à frente
            maxMaxBufferLength: 60, // Até 60s se a banda permitir
            maxBufferSize: 60 * 1000 * 1000, // 60MB de buffer na memória
            startFragPrefetch: true, // Pré-carrega o próximo segmento em paralelo para transições lisas
            fpsDroppedMonitoring: true, // Monitora e recupera dropped frames para 60Hz/120Hz fluído
            fpsDroppedMonitoringPeriod: 5000,
            fpsDroppedMonitoringThreshold: 0.2,
            capLevelToPlayerSize: false,
            manifestLoadingTimeOut: 20000,
            manifestLoadingMaxRetry: 5,
            manifestLoadingRetryDelay: 1000,
            levelLoadingTimeOut: 20000,
            levelLoadingMaxRetry: 5,
            levelLoadingRetryDelay: 1000,
            fragLoadingTimeOut: 25000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            appendErrorMaxRetry: 5,
          });

          hlsInstance.loadSource(currentStreamUrl);
          hlsInstance.attachMedia(videoEl);

          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsBuffering(false);
            setPlaybackError(null);
            videoEl.play().catch(() => {});
          });

          hlsInstance.on(Hls.Events.BUFFER_APPENDED, () => {
            setIsBuffering(false);
          });

          hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('[HLS] Erro de rede no canal ao vivo, reconectando...', data);
                  hlsInstance.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('[HLS] Falha de decodificação no canal ao vivo, recuperando...', data);
                  hlsInstance.recoverMediaError();
                  break;
                default:
                  console.error('[HLS] Erro fatal no canal ao vivo:', data);
                  hlsInstance.destroy();
                  setPlaybackError(
                    'Não foi possível reproduzir este canal ao vivo. Verifique sua conexão ou se o canal está ativo.'
                  );
                  break;
              }
            } else if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
              console.warn('[HLS] Buffer estagnado, retomando carregamento de chunks...');
              hlsInstance.startLoad();
            }
          });
        } catch (err) {
          console.error('[HLS] Erro ao instanciar Hls.js:', err);
        }
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Suporte nativo ao HLS no Safari (iOS / Mac)
        videoEl.src = currentStreamUrl;
        videoEl.play().catch(() => {});
      }
    };

    if (!(window as any).Hls) {
      let script = document.getElementById('hls-cdn-script') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'hls-cdn-script';
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
        script.onload = () => attachHls();
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', attachHls);
      }
    } else {
      attachHls();
    }

    return () => {
      isCancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [currentStreamUrl, type]);

  useEffect(() => {
    try {
      player.muted = false;
      player.volume = 1.0;
      player.audioMixingMode = 'doNotMix';
      player.keepScreenOnWhilePlaying = true;
    } catch {
      // ignore
    }
  }, [player]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetHideTimer]);

  // Persist progress periodically or on unmount
  const persistCurrentProgress = useCallback(
    (time: number, totalDur: number) => {
      if (type === 'live') return;
      const pct = calculatePercentage(time, totalDur);
      saveProgress({
        id: contentId,
        seriesId,
        title,
        posterUrl: posterUrl || '',
        type,
        seasonNumber,
        episodeNumber,
        currentTime: Math.floor(time),
        duration: Math.floor(totalDur),
        percentage: pct,
        updatedAt: Date.now(),
        streamUrl,
      });
    },
    [contentId, seriesId, title, posterUrl, type, seasonNumber, episodeNumber, streamUrl, saveProgress]
  );

  const isNavigatingEpisodeRef = useRef(false);

  const handleGoToNextEpisode = useCallback(() => {
    if (!nextEpisode || isNavigatingEpisodeRef.current) return;
    isNavigatingEpisodeRef.current = true;

    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }

    navigation.replace('PlayerScreen', {
      streamUrl: nextEpisode.streamUrl,
      title: nextEpisode.title,
      posterUrl: nextEpisode.posterUrl || posterUrl,
      type: 'series',
      contentId: nextEpisode.id,
      seriesId,
      seasonNumber: nextEpisode.seasonNumber,
      episodeNumber: nextEpisode.episodeNumber,
      initialTime: 0,
      seriesEpisodes: episodesList,
    });
  }, [
    nextEpisode,
    isCasting,
    streamPosition,
    player,
    currentTime,
    streamDuration,
    duration,
    persistCurrentProgress,
    navigation,
    posterUrl,
    seriesId,
    episodesList,
  ]);

  const handleGoToPrevEpisode = useCallback(() => {
    if (!prevEpisode || isNavigatingEpisodeRef.current) return;
    isNavigatingEpisodeRef.current = true;

    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }

    navigation.replace('PlayerScreen', {
      streamUrl: prevEpisode.streamUrl,
      title: prevEpisode.title,
      posterUrl: prevEpisode.posterUrl || posterUrl,
      type: 'series',
      contentId: prevEpisode.id,
      seriesId,
      seasonNumber: prevEpisode.seasonNumber,
      episodeNumber: prevEpisode.episodeNumber,
      initialTime: 0,
      seriesEpisodes: episodesList,
    });
  }, [
    prevEpisode,
    isCasting,
    streamPosition,
    player,
    currentTime,
    streamDuration,
    duration,
    persistCurrentProgress,
    navigation,
    posterUrl,
    seriesId,
    episodesList,
  ]);

  const hasAutoAdvancedRef = useRef(false);
  const nextEpisodeRef = useRef(nextEpisode);
  nextEpisodeRef.current = nextEpisode;
  const handleGoToNextEpisodeRef = useRef(handleGoToNextEpisode);
  handleGoToNextEpisodeRef.current = handleGoToNextEpisode;

  useEffect(() => {
    player.timeUpdateEventInterval = 0.5;
    const subTime = player.addListener('timeUpdate', (event) => {
      if (typeof event.currentTime === 'number' && Number.isFinite(event.currentTime)) {
        if (initialTime > 0 && !hasAppliedInitialTimeRef.current) {
          if (event.currentTime < 1) {
            try {
              player.currentTime = initialTime;
            } catch {}
            return;
          }
          hasAppliedInitialTimeRef.current = true;
        }

        currentTimeRef.current = event.currentTime;

        // Otimização crucial para 60/120Hz no Web:
        // Só dispara re-renderização do React se os controles estiverem visíveis na tela.
        // Quando os controles estão ocultos, zera o consumo de CPU da thread principal,
        // garantindo que o vídeo rode com fluidez máxima de 60/120 FPS sem perda de quadros.
        if (showControlsRef.current) {
          setCurrentTime(event.currentTime);
        }

        if (
          type === 'series' &&
          nextEpisodeRef.current &&
          player.duration > 15 &&
          event.currentTime >= player.duration - 1.5 &&
          !hasAutoAdvancedRef.current
        ) {
          hasAutoAdvancedRef.current = true;
          handleGoToNextEpisodeRef.current();
        }
      }
      if (player.duration > 0 && Number.isFinite(player.duration)) {
        durationRef.current = player.duration;
        setDuration(player.duration);
      }
    });
    const subPlaying = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    const subStatus = player.addListener('statusChange', (event) => {
      setIsBuffering(event.status === 'loading');
      if (event.status === 'error') {
        if (Platform.OS === 'web' && type === 'live') {
          return;
        }
        if (type === 'live' && !attemptedAlternativeRef.current) {
          const altUrl = xtreamService.getAlternativeLiveStreamUrl(currentStreamUrl);
          if (altUrl) {
            attemptedAlternativeRef.current = true;
            setCurrentStreamUrl(altUrl);
            player.replace({
              uri: altUrl,
              headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                Accept: '*/*',
              },
            });
            player.play();
            return;
          }
        }
        setPlaybackError(
          'Não foi possível reproduzir este conteúdo. Verifique sua conexão ou se o canal está ativo.'
        );
      } else if (event.status === 'readyToPlay') {
        setPlaybackError(null);
        if (player.duration > 0 && Number.isFinite(player.duration)) {
          setDuration(player.duration);
        }
        if (initialTime > 0 && !hasAppliedInitialTimeRef.current) {
          hasAppliedInitialTimeRef.current = true;
          try {
            player.currentTime = initialTime;
            setCurrentTime(initialTime);
          } catch (e) {
            console.warn('[Player] Falha ao aplicar initialTime no readyToPlay:', e);
          }
        }
      }
    });
    const subEnd = (player as any).addListener?.('playToEnd', () => {
      if (type === 'series' && nextEpisodeRef.current && !hasAutoAdvancedRef.current) {
        hasAutoAdvancedRef.current = true;
        handleGoToNextEpisodeRef.current();
      }
    });
    return () => {
      subTime.remove();
      subPlaying.remove();
      subStatus.remove();
      subEnd?.remove?.();
    };
  }, [player, currentStreamUrl, type]);

  const handleRetry = useCallback(() => {
    setPlaybackError(null);
    attemptedAlternativeRef.current = false;
    setCurrentStreamUrl(streamUrl);
    player.replace({
      uri: streamUrl,
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        Accept: '*/*',
      },
    });
    player.play();
  }, [player, streamUrl]);

  useEffect(() => {
    return () => {
      const cur = currentTimeRef.current;
      const dur = durationRef.current || duration;
      if (cur > 0 && dur > 0) {
        persistCurrentProgress(cur, dur);
      }
    };
  }, [duration, persistCurrentProgress]);

  const hasCastAutoAdvancedRef = useRef(false);

  useEffect(() => {
    if (
      isCasting &&
      type === 'series' &&
      nextEpisode &&
      streamDuration > 15 &&
      streamPosition >= streamDuration - 3 &&
      !hasCastAutoAdvancedRef.current
    ) {
      hasCastAutoAdvancedRef.current = true;
      handleGoToNextEpisode();
    }
  }, [isCasting, type, nextEpisode, streamDuration, streamPosition, handleGoToNextEpisode]);

  // Gerenciar transição de desconexão da TV para retomar no celular
  useEffect(() => {
    if (prevIsCastingRef.current && !isCasting) {
      if (streamPosition > 0) {
        try {
          player.currentTime = streamPosition;
          setCurrentTime(streamPosition);
        } catch {
          // ignore
        }
      }
      try {
        player.play();
      } catch {
        // ignore
      }
    }
    prevIsCastingRef.current = isCasting;
  }, [isCasting, streamPosition, player]);

  // Transmitir mídia para a TV quando o Cast estiver conectado
  useEffect(() => {
    if (isCasting && !hasCastRef.current) {
      hasCastRef.current = true;
      try {
        player.pause();
      } catch {
        // ignore
      }
      castMedia({
        streamUrl,
        title,
        posterUrl,
        type,
        contentId,
        seriesId,
        seasonNumber,
        episodeNumber,
        initialTime: currentTimeRef.current,
      }).catch((err) => {
        console.warn('Erro ao carregar mídia no Chromecast:', err);
        Alert.alert(
          'Erro na Transmissão',
          'Não foi possível iniciar a reprodução na TV. Verifique a conexão com o Chromecast.'
        );
      });
    } else if (!isCasting) {
      hasCastRef.current = false;
    }
  }, [
    isCasting,
    streamUrl,
    title,
    posterUrl,
    type,
    contentId,
    seriesId,
    seasonNumber,
    episodeNumber,
    castMedia,
    player,
  ]);

  const handleBack = useCallback(() => {
    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }
    navigation.goBack();
  }, [isCasting, streamPosition, streamDuration, currentTime, duration, navigation, persistCurrentProgress, player]);

  const handleLocalSeek = useCallback(
    (offsetSeconds: number) => {
      resetHideTimer();
      const current =
        typeof player.currentTime === 'number' && Number.isFinite(player.currentTime)
          ? player.currentTime
          : currentTime || 0;
      const maxDur =
        duration && Number.isFinite(duration)
          ? duration
          : player.duration && Number.isFinite(player.duration)
          ? player.duration
          : 0;
      let nextTime = current + offsetSeconds;
      if (nextTime < 0) nextTime = 0;
      if (maxDur > 0 && nextTime > maxDur) nextTime = maxDur;
      try {
        if (typeof (player as any).seekBy === 'function') {
          (player as any).seekBy(offsetSeconds);
        } else {
          player.currentTime = nextTime;
        }
        setCurrentTime(nextTime);
      } catch {
        // ignore
      }
    },
    [player, currentTime, duration, resetHideTimer]
  );

  const handleProgressBarSeek = useCallback(
    (percent: number) => {
      resetHideTimer();
      const maxDur =
        duration && Number.isFinite(duration)
          ? duration
          : player.duration && Number.isFinite(player.duration)
          ? player.duration
          : 0;
      if (maxDur > 0) {
        const targetTime = (percent / 100) * maxDur;
        try {
          player.currentTime = targetTime;
          setCurrentTime(targetTime);
        } catch {
          // ignore
        }
      }
    },
    [duration, player, resetHideTimer]
  );

  const handleCastProgressBarSeek = useCallback(
    (percent: number) => {
      if (streamDuration > 0) {
        const targetTime = (percent / 100) * streamDuration;
        castSeek(targetTime);
      }
    },
    [castSeek, streamDuration]
  );

  const handleTogglePlay = useCallback(() => {
    resetHideTimer();
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, resetHideTimer]);

  // Controles de teclado no computador (Web): Espaço = Play/Pause, Setas = Avançar/Voltar 10s, M = Mudo, F = Tela Cheia, N = Próximo EP, P = EP Anterior
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleLocalSeek(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleLocalSeek(-10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setContentFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
      } else if ((e.key === 'n' || e.key === 'N') && nextEpisode) {
        e.preventDefault();
        handleGoToNextEpisode();
      } else if ((e.key === 'p' || e.key === 'P') && prevEpisode) {
        e.preventDefault();
        handleGoToPrevEpisode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleTogglePlay,
    handleLocalSeek,
    handleToggleMute,
    handleToggleFullscreen,
    handleGoToNextEpisode,
    handleGoToPrevEpisode,
    nextEpisode,
    prevEpisode,
  ]);

  const insets = useAppInsets();

  /* --- CENÁRIO B: Cast Ativo na TV (Controle Remoto) --- */
  if (isCasting) {
    const castPct = calculatePercentage(streamPosition, streamDuration);

    return (
      <RemoteContainer testID="cast-remote-screen">
        <RemoteTop insetTop={insets.top}>
          <ControlButton
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </ControlButton>

          <CastBadge>
            <CastBadgeDot />
            <CastBadgeText>Transmitindo na TV</CastBadgeText>
          </CastBadge>

          <CastButtonGlobal />
        </RemoteTop>

        <RemoteArtworkWrapper>
          <RemoteArtwork
            source={{ uri: posterUrl }}
            contentFit="cover"
            transition={300}
          />
        </RemoteArtworkWrapper>

        <RemoteInfo>
          <RemoteTitle>{title}</RemoteTitle>
          <RemoteSub>
            {type === 'live' ? 'Transmissão Ao Vivo' : 'Reproduzindo no Chromecast'}
          </RemoteSub>
        </RemoteInfo>

        {type !== 'live' && (
          <BottomControls>
            <ProgressBarGlobal
              percentage={castPct}
              height={6}
              interactive
              onSeek={handleCastProgressBarSeek}
              testID="cast-progress-bar"
            />
            <TimeRow>
              <TimeText>{formatSeconds(streamPosition)}</TimeText>
              <TimeText>{formatSeconds(streamDuration)}</TimeText>
            </TimeRow>
          </BottomControls>
        )}

        <CenterControls>
          {type === 'series' && prevEpisode && (
            <SeekButton
              onPress={handleGoToPrevEpisode}
              accessibilityRole="button"
              accessibilityLabel="Episódio Anterior"
              testID="cast-prev-episode-button"
            >
              <MaterialIcons name="skip-previous" size={28} color="#FFFFFF" />
            </SeekButton>
          )}

          {type !== 'live' && (
            <SeekButton
              onPress={() => castSeek(Math.max(0, streamPosition - 10))}
              accessibilityRole="button"
              accessibilityLabel="Voltar 10 segundos"
            >
              <MaterialIcons name="replay-10" size={28} color="#FFFFFF" />
            </SeekButton>
          )}

          <BigPlayButton
            onPress={isCastPlaying ? castPause : castPlay}
            accessibilityRole="button"
            accessibilityLabel={isCastPlaying ? 'Pausar' : 'Reproduzir'}
          >
            <MaterialIcons
              name={isCastPlaying ? 'pause' : 'play-arrow'}
              size={38}
              color="#FFFFFF"
            />
          </BigPlayButton>

          {type !== 'live' && (
            <SeekButton
              onPress={() => castSeek(streamPosition + 10)}
              accessibilityRole="button"
              accessibilityLabel="Avançar 10 segundos"
            >
              <MaterialIcons name="forward-10" size={28} color="#FFFFFF" />
            </SeekButton>
          )}

          {type === 'series' && nextEpisode && (
            <SeekButton
              onPress={handleGoToNextEpisode}
              accessibilityRole="button"
              accessibilityLabel="Próximo Episódio"
              testID="cast-next-episode-button"
            >
              <MaterialIcons name="skip-next" size={28} color="#FFFFFF" />
            </SeekButton>
          )}
        </CenterControls>

        <ButtonGlobal
          label="Desconectar da TV"
          variant="secondary"
          onPress={stopCast}
        />
      </RemoteContainer>
    );
  }

  /* --- CENÁRIO A: Reprodução Local no Dispositivo --- */
  const localPct = calculatePercentage(currentTime, duration);

  return (
    <Container testID="local-player-screen">
      <VideoWrapper>
        <StyledVideo
          player={player}
          contentFit={contentFitMode}
          nativeControls={false}
          allowsPictureInPicture
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Buffering Spinner */}
        {isBuffering && !playbackError && (
          <BufferingWrapper pointerEvents="none" testID="buffering-indicator">
            <ActivityIndicator size="large" color="#E50914" />
          </BufferingWrapper>
        )}

        {/* Playback Error Overlay */}
        {playbackError && (
          <ErrorOverlay testID="playback-error-overlay">
            <ErrorBox>
              <MaterialIcons name="error-outline" size={48} color="#E50914" />
              <ErrorTitle>Erro de Reprodução</ErrorTitle>
              <ErrorMessage>{playbackError}</ErrorMessage>
              <ErrorButtonGroup>
                <ButtonGlobal
                  label="Tentar Novamente"
                  onPress={handleRetry}
                  variant="primary"
                  size="md"
                />
                <ButtonGlobal
                  label="Voltar"
                  onPress={handleBack}
                  variant="secondary"
                  size="md"
                />
              </ErrorButtonGroup>
            </ErrorBox>
          </ErrorOverlay>
        )}

        {/* Permanent touch target over video to toggle controls */}
        <BackgroundPressable
          testID="video-background-touch"
          onPress={() => {
            if (showControls) {
              setShowControls(false);
            } else {
              resetHideTimer();
            }
          }}
        />

        {showControls && (
          <ControlsOverlay pointerEvents="box-none">
            <TopControls insetTop={insets.top} pointerEvents="box-none">
              <ControlButton
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                testID="player-back-button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </ControlButton>
              <PlayerTitle>{title}</PlayerTitle>
              <TopRightActions pointerEvents="box-none">
                <ControlButton
                  onPress={() =>
                    setContentFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'))
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    contentFitMode === 'contain' ? 'Preencher tela' : 'Ajustar à tela'
                  }
                  testID="aspect-ratio-button"
                  style={{ marginRight: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons
                    name={contentFitMode === 'contain' ? 'aspect-ratio' : 'fit-screen'}
                    size={22}
                    color="#FFFFFF"
                  />
                </ControlButton>
                {Platform.OS === 'web' && (
                  <ControlButton
                    onPress={handleToggleFullscreen}
                    accessibilityRole="button"
                    accessibilityLabel="Tela Cheia"
                    testID="fullscreen-button"
                    style={{ marginRight: 8 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="fullscreen" size={24} color="#FFFFFF" />
                  </ControlButton>
                )}
                <ControlButton
                  onPress={handleToggleMute}
                  accessibilityRole="button"
                  accessibilityLabel={isMuted ? 'Ativar som' : 'Desativar som'}
                  testID="player-mute-button"
                  style={{ marginRight: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons
                    name={isMuted ? 'volume-off' : 'volume-up'}
                    size={22}
                    color="#FFFFFF"
                  />
                </ControlButton>
                <CastButtonGlobal />
              </TopRightActions>
            </TopControls>

            <CenterControls pointerEvents="box-none">
              {type === 'series' && prevEpisode && (
                <SeekButton
                  onPress={handleGoToPrevEpisode}
                  accessibilityRole="button"
                  accessibilityLabel="Episódio Anterior"
                  testID="prev-episode-button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="skip-previous" size={28} color="#FFFFFF" />
                </SeekButton>
              )}

              {type !== 'live' && (
                <SeekButton
                  onPress={() => handleLocalSeek(-10)}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar 10 segundos"
                  testID="seek-back-button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="replay-10" size={28} color="#FFFFFF" />
                </SeekButton>
              )}

              <BigPlayButton
                onPress={handleTogglePlay}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pausar' : 'Reproduzir'}
                testID="play-pause-button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={40}
                  color="#FFFFFF"
                />
              </BigPlayButton>

              {type !== 'live' && (
                <SeekButton
                  onPress={() => handleLocalSeek(10)}
                  accessibilityRole="button"
                  accessibilityLabel="Avançar 10 segundos"
                  testID="seek-forward-button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="forward-10" size={28} color="#FFFFFF" />
                </SeekButton>
              )}

              {type === 'series' && nextEpisode && (
                <SeekButton
                  onPress={handleGoToNextEpisode}
                  accessibilityRole="button"
                  accessibilityLabel="Próximo Episódio"
                  testID="next-episode-button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="skip-next" size={28} color="#FFFFFF" />
                </SeekButton>
              )}
            </CenterControls>

            <BottomControls pointerEvents="box-none">
              {type !== 'live' && (
                <>
                  <ProgressBarGlobal
                    percentage={localPct}
                    height={6}
                    interactive
                    onSeek={handleProgressBarSeek}
                    testID="player-progress-bar"
                  />
                  <TimeRow pointerEvents="none">
                    <TimeText>{formatSeconds(currentTime)}</TimeText>
                    <TimeText>{formatSeconds(duration || player.duration || 0)}</TimeText>
                  </TimeRow>
                </>
              )}
            </BottomControls>
          </ControlsOverlay>
        )}
      </VideoWrapper>
    </Container>
  );
};
