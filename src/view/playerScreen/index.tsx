import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  BackHandler,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppInsets } from '../../hooks/useAppInsets';
import { PlayerScreenProps, LiveChannelItem } from '../../routes/types';
import { IEpgListing } from '../../@types/xtream';
import { useCast } from '../../hooks/useCast';
import { useAuth } from '../../hooks/useAuth';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { usePlayerSystemUI } from '../../hooks/usePlayerSystemUI';
import { useProgressPersistence } from '../../hooks/useProgressPersistence';
import { useCategoryManager } from '../../hooks/useCategoryManager';
import {
  formatSeconds,
  calculatePercentage,
  cleanSeriesTitle,
  cleanEpisodeDisplayTitle,
  formatEpisodeTitle,
} from '../../utils/formatters';
import { xtreamService, extractDirectUrl, resolveUrlForPlatform } from '../../services/xtreamService';
import { storageService } from '../../services/storageService';
import { prefetchService } from '../../services/prefetchService';
import { ProgressBarGlobal } from '../../components/progressBarGlobal';
import { IProgressBarHoverData } from '../../components/progressBarGlobal/types';
import { CastButtonGlobal } from '../../components/castButtonGlobal';
import { ButtonGlobal } from '../../components/buttonGlobal';
import { EpgModalGlobal } from '../../components/epgModalGlobal';
import { getHls } from '../../utils/hls';
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
  EpgContainer,
  EpgHeaderRow,
  EpgNowBadge,
  EpgNowBadgeText,
  EpgProgramTitle,
  EpgTimeRow,
  EpgTimeText,
  EpgTrack,
  EpgFill,
  EpgNextText,
  DrawerBackdrop,
  DrawerContainer,
  DrawerHeader,
  DrawerTitle,
  DrawerSearchInput,
  DrawerItem,
  DrawerItemLogo,
  DrawerItemText,
  SettingsModalBackdrop,
  SettingsModalContent,
  SettingsSection,
  SettingsSectionTitle,
  SpeedRow,
  SpeedButton,
  SpeedButtonText,
  TrackItem,
  TrackItemText,
  NextEpisodeContainer,
  NextEpisodeHeader,
  NextEpisodeCountdown,
  NextEpisodeTitle,
  NextEpisodeButtonRow,
  NextEpisodePlayBtn,
  NextEpisodePlayBtnText,
  NextEpisodeCancelBtn,
  NextEpisodeCancelBtnText,
  LockScreenBackdrop,
  UnlockButton,
  UnlockButtonText,
  SleepTimerBadge,
  SleepTimerBadgeText,
  DoubleTapFeedbackContainer,
  DoubleTapFeedbackSide,
  DoubleTapFeedbackCircle,
  DoubleTapFeedbackText,
  VolumeControlGroup,
  VolumeSliderTrack,
  VolumeSliderFill,
  VolumeSliderThumb,
  VolumeHudContainer,
  VolumeHudCard,
  VolumeHudText,
  VolumeHudBar,
  VolumeHudBarFill,
  TimelinePreviewContainer,
  TimelinePreviewCard,
  TimelinePreviewVideoWrapper,
  TimelinePreviewBadge,
} from './style';
import { FocusableGlobal } from '../../components/focusableGlobal';
import { TV_LIST_PROPS } from '../../constants/tv';

async function safeReplacePlayerSource(playerInstance: any, source: any): Promise<void> {
  if (!playerInstance) return;
  if (typeof playerInstance.replaceAsync === 'function') {
    try {
      await playerInstance.replaceAsync(source);
      return;
    } catch (err) {
      console.warn('[Player] replaceAsync error, falling back to replace:', err);
    }
  }
  if (typeof playerInstance.replace === 'function') {
    playerInstance.replace(source);
  }
}

// Module-level guards to prevent auto-advance loops across rapid screen remounts
let globalLastAdvanceTimestamp = 0;
let globalLastAdvancedId = '';

// Na TV, o próximo episódio é anunciado nos últimos segundos e a troca acontece com o atual
// ainda tocando, como na troca manual (que funciona); trocar depois do fim falhava
const CAST_NEXT_PROMPT_BEFORE_END_S = 25;
const CAST_NEXT_ADVANCE_BEFORE_END_S = 10;

// Alguns filmes e episódios da lista vêm com áudio 5.1 ou vídeo HEVC (H.265): o celular toca,
// mas o Chromecast não. Em teste, a versão 5.1 de um filme falhava e a versão estéreo tocava
const CAST_UNSUPPORTED_MESSAGE =
  'O Chromecast não conseguiu reproduzir este vídeo. Alguns filmes e episódios vêm com áudio 5.1 ou vídeo HEVC, que ele não toca. Assista no celular ou tente outra versão do título, se houver.';

function describeCastFailure(err?: unknown): string {
  if (err instanceof Error && err.message.includes('Nenhum dispositivo')) {
    return 'O app perdeu a conexão com o Chromecast. Desconecte e conecte de novo.';
  }
  return CAST_UNSUPPORTED_MESSAGE;
}

// Na tela de controle da TV o aviso de próximo episódio fica no fluxo, acima dos botões
const CAST_NEXT_EPISODE_CARD_STYLE: ViewStyle = {
  position: 'relative',
  bottom: 0,
  right: 0,
  width: '100%',
  marginBottom: 16,
};

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
    liveChannels,
    isCatchup = false,
  } = route.params;

  const { account } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompactHeight = screenHeight < 500;
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
          const baseSeries = info.info?.name || cleanSeriesTitle(title);
          const flatEps = seasons.flatMap((seasonKey) => {
            const eps = epsMap[seasonKey] || [];
            return eps.map((ep: any) => ({
              id: String(ep.id),
              episodeNumber: Number(ep.episode_num),
              seasonNumber: Number(seasonKey),
              title: formatEpisodeTitle(baseSeries, seasonKey, ep.episode_num, ep.title),
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
  const [volume, setVolume] = useState<number>(1.0);
  const [isVolumeSliderOpen, setIsVolumeSliderOpen] = useState(false);
  const [volumeHud, setVolumeHud] = useState<{ visible: boolean; level: number } | null>(null);
  const volumeHudTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const wasControlsHiddenOnFirstTapRef = useRef(false);

  const touchStartY = useRef<number | null>(null);
  const touchStartVol = useRef<number>(1.0);
  const isDraggingVolume = useRef(false);
  const isDraggingSliderVolume = useRef(false);

  const [hoverScrub, setHoverScrub] = useState<{
    percentage: number;
    clientX: number;
    timeSecs: number;
  } | null>(null);
  const previewVideoRef = useRef<any>(null);
  const volumeTrackRef = useRef<any>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPreviewSeekRef = useRef<number | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const mainHlsInstanceRef = useRef<any>(null);
  const lastPlaybackCheckRef = useRef<{
    time: number;
    lastChangeTimestamp: number;
    recoveryAttempts: number;
    mountTimestamp: number;
  }>({
    time: initialTime,
    lastChangeTimestamp: Date.now(),
    recoveryAttempts: 0,
    mountTimestamp: Date.now(),
  });

  const initialStreamUrl = useMemo(() => {
    let clean = extractDirectUrl(streamUrl);
    if (Platform.OS === 'web') {
      if (type === 'live' && clean.includes('.ts')) {
        clean = clean.replace(/\.ts(\?|$)/, '.m3u8$1');
      }
      return resolveUrlForPlatform(clean);
    }
    return clean;
  }, [streamUrl, type]);

  const [currentStreamUrl, setCurrentStreamUrl] = useState(initialStreamUrl);
  const attemptedAlternativeRef = useRef(false);
  const hasAppliedInitialTimeRef = useRef(false);

  // Informações ativas de canais / conteúdos
  const [activeContentId, setActiveContentId] = useState(contentId);
  const [activeTitle, setActiveTitle] = useState(() =>
    type === 'series' ? cleanEpisodeDisplayTitle(title) : title
  );
  const [activePoster, setActivePoster] = useState(posterUrl);
  const [liveChannelsList, setLiveChannelsList] = useState<LiveChannelItem[]>(liveChannels || []);

  useEffect(() => {
    if (liveChannels && liveChannels.length > 0) {
      setLiveChannelsList(liveChannels);
    }
  }, [liveChannels]);

  useEffect(() => {
    setActiveTitle(type === 'series' ? cleanEpisodeDisplayTitle(title) : title);
    setActivePoster(posterUrl);
    setActiveContentId(contentId);
  }, [title, posterUrl, contentId, type]);

  // EPG (Guia de Programação) para TV ao Vivo
  const [epgList, setEpgList] = useState<IEpgListing[]>([]);
  const [epgLoading, setEpgLoading] = useState(false);
  const [showEpgModal, setShowEpgModal] = useState(false);

  // Gaveta lateral de canais (Zapping)
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const { hiddenStreams } = useCategoryManager('live');

  // Modal de Ajustes (Velocidade, Áudio e Legendas)
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Picture-in-Picture do sistema no Android (celular/tablet; TVs não suportam)
  const videoViewRef = useRef<VideoView>(null);
  const canUseSystemPip = Platform.OS === 'android' && !Platform.isTV;
  const [isInPip, setIsInPip] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<any>(null);
  const [availableSubtitles, setAvailableSubtitles] = useState<any[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<any>(null);

  const videoSource = useMemo(() => {
    const isHls = currentStreamUrl.includes('.m3u8') || (type === 'live' && !currentStreamUrl.includes('.mp4'));
    return {
      uri: currentStreamUrl,
      contentType: (isHls ? 'hls' : 'auto') as any,
      useCaching: false,
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        Accept: '*/*',
        Connection: 'keep-alive',
      },
    };
  }, [currentStreamUrl, type]);

  const { saveProgress, getProgress } = useWatchHistory();
  const {
    isCasting,
    isPlaying: isCastPlaying,
    isPaused: isCastPaused,
    isBuffering: isCastBuffering,
    streamPosition,
    streamDuration,
    castMedia,
    play: castPlay,
    pause: castPause,
    seek: castSeek,
    stopCast,
    currentMedia: activeCastMedia,
    mediaStatus: castMediaStatus,
  } = useCast();

  // Se o initialTime for no fim do vídeo (>= 95% do progresso salvo ou nos últimos 15 segundos), reinicia do começo
  const effectiveInitialTime = useMemo(() => {
    if (!initialTime || initialTime <= 2) return 0;
    const progress = getProgress(contentId);
    if (progress) {
      if (progress.percentage >= 95) return 0;
      if (progress.duration > 30 && progress.currentTime >= progress.duration - 15) return 0;
    }
    return initialTime;
  }, [initialTime, contentId, getProgress]);

  const [castError, setCastError] = useState<string | null>(null);
  const isCastingRef = useRef(isCasting);
  isCastingRef.current = isCasting;
  const prevIsCastingRef = useRef(isCasting);
  const hasCastRef = useRef(false);
  const lastCastPositionRef = useRef(0);
  const isDisconnectingCastRef = useRef(false);
  const hasCastAutoAdvancedRef = useRef(false);
  const hasCastStartedPlayingRef = useRef(false);
  const maxCastPositionObservedRef = useRef(
    typeof effectiveInitialTime === 'number' && effectiveInitialTime > 0 ? effectiveInitialTime : 0
  );

  useEffect(() => {
    if (isCasting && streamPosition > 0) {
      lastCastPositionRef.current = streamPosition;
    }
  }, [isCasting, streamPosition]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1.0;
    p.audioMixingMode = 'doNotMix';
    p.keepScreenOnWhilePlaying = true;
    if (type === 'live') {
      p.bufferOptions = {
        preferredForwardBufferDuration: 30,
        minBufferForPlayback: 1.0,
        prioritizeTimeOverSizeThreshold: true,
        waitsToMinimizeStalling: true,
        maxBufferBytes: 30 * 1024 * 1024,
      };
    } else {
      p.bufferOptions = {
        preferredForwardBufferDuration: 90,
        minBufferForPlayback: 1.0,
        prioritizeTimeOverSizeThreshold: true,
        waitsToMinimizeStalling: true,
        maxBufferBytes: 80 * 1024 * 1024,
      };
    }
    p.seekTolerance = {
      toleranceBefore: 2.0,
      toleranceAfter: 2.0,
    };
    if (effectiveInitialTime > 2) {
      p.currentTime = effectiveInitialTime;
    }
    // Autoplay localmente apenas se NÃO estiver transmitindo para a TV
    if (!isCastingRef.current) {
      try {
        p.play();
      } catch {
        // ignore
      }
    } else {
      try {
        p.pause();
        p.muted = true;
        p.volume = 0;
      } catch {}
    }
  });

  // Local player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(effectiveInitialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [contentFitMode, setContentFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');

  // Sleep Timer states
  type SleepTimerOption = 'off' | 15 | 30 | 45 | 60 | 'end';
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>('off');
  const [sleepTimerRemainingSecs, setSleepTimerRemainingSecs] = useState<number | null>(null);
  const sleepTimerRef = useRef<SleepTimerOption>('off');
  sleepTimerRef.current = sleepTimer;

  // Screen lock state
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [showUnlockButton, setShowUnlockButton] = useState(false);
  const isScreenLockedRef = useRef(false);
  isScreenLockedRef.current = isScreenLocked;
  const unlockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Next episode card states
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(15);
  const [nextEpisodeDismissed, setNextEpisodeDismissed] = useState(false);
  const nextEpisodeDismissedRef = useRef(false);
  nextEpisodeDismissedRef.current = nextEpisodeDismissed;
  const showNextEpisodePromptRef = useRef(false);
  showNextEpisodePromptRef.current = showNextEpisodePrompt;

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const currentTimeRef = useRef(effectiveInitialTime);
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

  // Estados de foco para controle remoto (Android TV / TV Box)
  const [focusedPlayerBtn, setFocusedPlayerBtn] = useState<string | null>(null);
  const [focusedDrawerChannelId, setFocusedDrawerChannelId] = useState<string | null>(null);

  // Tratamento do botão Voltar do controle remoto em TVs e Android
  useEffect(() => {
    const onBackPress = () => {
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return true;
      }
      if (showChannelDrawer) {
        setShowChannelDrawer(false);
        return true;
      }
      if (showEpgModal) {
        setShowEpgModal(false);
        return true;
      }
      if (showNextEpisodePrompt) {
        setShowNextEpisodePrompt(false);
        return true;
      }
      // Voltar com o vídeo tocando vira janelinha flutuante (a seta da tela sai do player)
      if (canUseSystemPip && isPlaying && !isCastingRef.current && !isInPip && videoViewRef.current) {
        // Se o PiP estiver desativado para o app nas configurações do Android, sai do player
        videoViewRef.current.startPictureInPicture().catch(() => navigation.goBack());
        return true;
      }
      if (showControls) {
        setShowControls(false);
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [
    showSettingsModal,
    showChannelDrawer,
    showEpgModal,
    showNextEpisodePrompt,
    showControls,
    canUseSystemPip,
    isPlaying,
    isInPip,
    navigation,
  ]);

  const handleSetVolume = useCallback(
    (newVol: number) => {
      resetHideTimer();
      const clamped = Math.max(0, Math.min(1, Math.round(newVol * 100) / 100));
      setVolume(clamped);
      try {
        player.volume = clamped;
        if (clamped > 0) {
          player.muted = false;
          setIsMuted(false);
        } else {
          player.muted = true;
          setIsMuted(true);
        }
      } catch {
        // ignore
      }

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const videoEls = document.querySelectorAll('video');
        videoEls.forEach((v) => {
          if (v !== previewVideoRef.current) {
            try {
              v.volume = clamped;
              v.muted = clamped === 0;
            } catch {}
          }
        });
      }

      setVolumeHud({ visible: true, level: Math.round(clamped * 100) });
      if (volumeHudTimerRef.current) clearTimeout(volumeHudTimerRef.current);
      volumeHudTimerRef.current = setTimeout(() => {
        setVolumeHud(null);
      }, 1200);
    },
    [player, resetHideTimer]
  );

  const handleToggleMute = useCallback(() => {
    resetHideTimer();
    const nextMuted = !isMuted;
    try {
      player.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && volume === 0) {
        player.volume = 1.0;
        setVolume(1.0);
      }
    } catch {
      // ignore
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const videoEls = document.querySelectorAll('video');
      videoEls.forEach((v) => {
        if (v !== previewVideoRef.current) {
          try {
            v.muted = nextMuted;
            if (!nextMuted && volume === 0) {
              v.volume = 1.0;
            }
          } catch {}
        }
      });
    }
  }, [isMuted, volume, player, resetHideTimer]);

  const calculateVolumeFromEvent = useCallback((e: any): number => {
    const native = e.nativeEvent || e;
    if (typeof window !== 'undefined' && volumeTrackRef.current?.getBoundingClientRect) {
      const rect = volumeTrackRef.current.getBoundingClientRect();
      const clientX = native.clientX ?? native.pageX ?? 0;
      if (rect && rect.width > 0) {
        const x = clientX - rect.left;
        return Math.max(0, Math.min(1, x / rect.width));
      }
    }
    const x = native.locationX ?? 45;
    return Math.max(0, Math.min(1, x / 90));
  }, []);

  const handleVolumeTrackClick = useCallback(
    (e: any) => {
      resetHideTimer();
      const vol = calculateVolumeFromEvent(e);
      handleSetVolume(vol);
    },
    [calculateVolumeFromEvent, handleSetVolume, resetHideTimer]
  );

  const handleVolumePointerDown = useCallback(
    (e: any) => {
      resetHideTimer();
      isDraggingSliderVolume.current = true;
      if (e.currentTarget?.setPointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
      const vol = calculateVolumeFromEvent(e);
      handleSetVolume(vol);
    },
    [calculateVolumeFromEvent, handleSetVolume, resetHideTimer]
  );

  const handleVolumePointerMove = useCallback(
    (e: any) => {
      if (!isDraggingSliderVolume.current) return;
      resetHideTimer();
      const vol = calculateVolumeFromEvent(e);
      handleSetVolume(vol);
    },
    [calculateVolumeFromEvent, handleSetVolume, resetHideTimer]
  );

  const handleVolumePointerUp = useCallback(
    (e: any) => {
      if (!isDraggingSliderVolume.current) return;
      isDraggingSliderVolume.current = false;
      if (e.currentTarget?.releasePointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
      }
      resetHideTimer();
      const vol = calculateVolumeFromEvent(e);
      handleSetVolume(vol);
    },
    [calculateVolumeFromEvent, handleSetVolume, resetHideTimer]
  );

  const volumeIconName = useMemo(() => {
    if (isMuted || volume === 0) return 'volume-off';
    if (volume <= 0.5) return 'volume-down';
    return 'volume-up';
  }, [isMuted, volume]);

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

  const cycleContentFit = useCallback(() => {
    setContentFitMode((prev) => {
      if (prev === 'contain') return 'cover';
      if (prev === 'cover') return 'fill';
      return 'contain';
    });
  }, []);

  const handleSetSleepTimer = useCallback((option: SleepTimerOption) => {
    setSleepTimer(option);
    sleepTimerRef.current = option;
    if (option === 'off' || option === 'end') {
      setSleepTimerRemainingSecs(null);
    } else {
      setSleepTimerRemainingSecs(option * 60);
    }
  }, []);

  useEffect(() => {
    if (sleepTimer === 'off' || sleepTimer === 'end' || sleepTimerRemainingSecs === null) return;

    const interval = setInterval(() => {
      setSleepTimerRemainingSecs((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          try {
            player.pause();
          } catch {}
          setSleepTimer('off');
          sleepTimerRef.current = 'off';
          Alert.alert(
            'Temporizador para Dormir',
            'A reprodução foi pausada automaticamente conforme configurado no temporizador.'
          );
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer, player]);

  const handleScreenTouchWhenLocked = useCallback(() => {
    setShowUnlockButton(true);
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
    }
    unlockTimeoutRef.current = setTimeout(() => {
      setShowUnlockButton(false);
    }, 3500);
  }, []);

  const handleUnlockScreen = useCallback(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
    }
    setIsScreenLocked(false);
    isScreenLockedRef.current = false;
    setShowUnlockButton(false);
    resetHideTimer();
  }, [resetHideTimer]);

  // Carregamento de EPG (Guia de Programação) para Canais Ao Vivo
  const fetchEpg = useCallback(
    async (channelId: string) => {
      if (!account || type !== 'live') return;
      try {
        setEpgLoading(true);
        const list = await xtreamService.getShortEpg(account, channelId, 4);
        setEpgList(list || []);
      } catch (err) {
        console.warn('[Player] Erro ao carregar EPG:', err);
        setEpgList([]);
      } finally {
        setEpgLoading(false);
      }
    },
    [account, type]
  );

  useEffect(() => {
    if (type === 'live' && activeContentId) {
      fetchEpg(activeContentId);
    }
  }, [type, activeContentId, fetchEpg]);

  const parseEpgTimestamp = (val?: string | number) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const num = Number(val);
    if (!isNaN(num) && num > 1000000) return num;
    const strVal = String(val).trim();
    const d = new Date(strVal.includes('T') ? strVal : strVal.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
    return 0;
  };

  const cleanProgramTitle = (rawTitle?: string) => {
    if (!rawTitle) return '';
    let t = rawTitle.replace(/^\[?\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}\]?\s*[-–:]?\s*/i, '');
    t = t.replace(/^\[?\d{1,2}[:.]\d{2}\]?\s*[-–:]?\s*/i, '');
    return t.trim();
  };

  const currentProgram = useMemo(() => {
    if (!epgList || epgList.length === 0) return null;
    const now = Math.floor(Date.now() / 1000);
    const active = epgList.find((p) => {
      const start = parseEpgTimestamp(p.start_timestamp || p.start);
      const stop = parseEpgTimestamp(p.stop_timestamp || p.end);
      return start > 0 && stop > 0 && now >= start && now <= stop;
    });
    return active || epgList[0];
  }, [epgList]);

  const nextProgram = useMemo(() => {
    if (!epgList || epgList.length <= 1) return null;
    if (!currentProgram) return epgList[1] || null;
    const idx = epgList.findIndex(
      (p) => (p.id && p.id === currentProgram.id) || p.title === currentProgram.title
    );
    if (idx >= 0 && idx < epgList.length - 1) {
      return epgList[idx + 1];
    }
    return null;
  }, [epgList, currentProgram]);

  const epgProgressPercent = useMemo(() => {
    if (!currentProgram) return 0;
    const start = parseEpgTimestamp(currentProgram.start_timestamp || currentProgram.start);
    const stop = parseEpgTimestamp(currentProgram.stop_timestamp || currentProgram.end);
    if (!start || !stop || stop <= start) return 0;
    const now = Math.floor(Date.now() / 1000);
    const pct = ((now - start) / (stop - start)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [currentProgram]);

  const formatEpgTime = (val?: string | number) => {
    if (!val) return '';
    const ts = parseEpgTimestamp(val);
    if (ts > 0) {
      const d = new Date(ts * 1000);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    if (typeof val === 'string' && val.includes(':')) {
      const parts = val.trim().split(' ');
      const timePart = parts[parts.length - 1];
      const match = timePart.match(/(\d{1,2}:\d{2})/);
      if (match) return match[1];
    }
    return '';
  };

  // Troca rápida de canal (Zapping)
  const filteredChannels = useMemo(() => {
    const visibleChannels = liveChannelsList.filter(
      (ch) =>
        !hiddenStreams.includes(String(ch.id)) &&
        !hiddenStreams.includes(String(ch.streamId))
    );
    if (!channelSearchQuery.trim()) return visibleChannels;
    const q = channelSearchQuery.toLowerCase();
    return visibleChannels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [liveChannelsList, channelSearchQuery, hiddenStreams]);

  const handleSwitchChannel = useCallback(
    (channel: LiveChannelItem) => {
      setShowChannelDrawer(false);
      if (channel.id === activeContentId) return;

      setActiveContentId(channel.id);
      setActiveTitle(channel.name);
      setActivePoster(channel.logoUrl);
      setPlaybackError(null);
      setIsBuffering(true);
      attemptedAlternativeRef.current = false;

      let newUrl = channel.streamUrl;
      if (Platform.OS === 'web' && newUrl.includes('.ts')) {
        newUrl = newUrl.replace(/\.ts(\?|$)/, '.m3u8$1');
      }
      setCurrentStreamUrl(newUrl);

      if (isCasting) {
        castMedia({
          streamUrl: extractDirectUrl(newUrl),
          title: channel.name,
          posterUrl: channel.logoUrl,
          type: 'live',
          contentId: channel.id,
        }).catch(() => {});
        try {
          player.pause();
          player.muted = true;
          player.volume = 0;
        } catch {}
      } else {
        try {
          safeReplacePlayerSource(player, {
            uri: newUrl,
            contentType: (newUrl.includes('.m3u8') ? 'hls' : 'auto') as any,
            headers: {
              'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
              Accept: '*/*',
            },
          });
          player.play();
        } catch (err) {
          console.warn('[Player] Erro ao trocar de canal:', err);
        }
      }
    },
    [activeContentId, player, isCasting, castMedia]
  );

  // Velocidade de Reprodução
  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
  const handleSetSpeed = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      try {
        player.playbackRate = speed;
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const videoEl = document.querySelector('video');
          if (videoEl) {
            videoEl.playbackRate = speed;
          }
        }
      } catch (err) {
        console.warn('[Player] Erro ao alterar velocidade:', err);
      }
    },
    [player]
  );

  // Faixas de Áudio e Legendas
  const refreshTracks = useCallback(() => {
    try {
      if ((player as any).availableAudioTracks) {
        setAvailableAudioTracks((player as any).availableAudioTracks || []);
        setSelectedAudioTrack((player as any).audioTrack || null);
      }
      if ((player as any).availableSubtitleTracks) {
        setAvailableSubtitles((player as any).availableSubtitleTracks || []);
        setSelectedSubtitle((player as any).subtitleTrack || null);
      }
    } catch {
      // ignore
    }
  }, [player]);

  const handleSelectAudioTrack = useCallback(
    (track: any) => {
      try {
        (player as any).audioTrack = track;
        setSelectedAudioTrack(track);
      } catch (err) {
        console.warn('[Player] Erro ao selecionar áudio:', err);
      }
    },
    [player]
  );

  const handleSelectSubtitleTrack = useCallback(
    (track: any) => {
      try {
        (player as any).subtitleTrack = track;
        setSelectedSubtitle(track);
      } catch (err) {
        console.warn('[Player] Erro ao selecionar legenda:', err);
      }
    },
    [player]
  );

  // Picture-in-Picture (PiP)
  const handleTogglePip = useCallback(async () => {
    resetHideTimer();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const videoEl = document.querySelector('video') as any;
      if (videoEl) {
        try {
          if (document.pictureInPictureElement) {
            await (document as any).exitPictureInPicture();
          } else if (videoEl.requestPictureInPicture) {
            await videoEl.requestPictureInPicture();
          } else {
            Alert.alert('Picture-in-Picture', 'PiP não é suportado pelo seu navegador.');
          }
        } catch (err) {
          console.warn('[Player] PiP não suportado ou negado:', err);
          Alert.alert('Picture-in-Picture', 'Não foi possível ativar o modo Picture-in-Picture.');
        }
        return;
      }
    }
    try {
      if (!videoViewRef.current) throw new Error('VideoView indisponível');
      await videoViewRef.current.startPictureInPicture();
    } catch {
      Alert.alert('Picture-in-Picture', 'Este aparelho não permite o modo Picture-in-Picture.');
    }
  }, [resetHideTimer]);

  usePlayerSystemUI({ isCasting, showControls, navigation });

  // Replay (TV Archive): abre o programa que já passou no lugar do canal ao vivo
  const handlePlayArchive = useCallback(
    (program: IEpgListing) => {
      if (!account || !activeContentId) return;
      const catchupUrl = xtreamService.buildCatchupStreamUrl(account, activeContentId, program);
      if (!catchupUrl) {
        Alert.alert('Replay', 'O servidor não informou o horário deste programa.');
        return;
      }
      setShowEpgModal(false);
      navigation.replace('PlayerScreen', {
        streamUrl: catchupUrl,
        title: `${activeTitle || title} • ${program.title}`,
        posterUrl: activePoster,
        type: 'movie',
        contentId: `catchup_${activeContentId}_${program.start_timestamp}`,
        isCatchup: true,
      });
    },
    [account, activeContentId, activeTitle, title, activePoster, navigation]
  );

  // Configura pré-carregamento suave de buffer e restauração de initialTime no elemento <video> do navegador (Web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let applied = false;
    let registeredVideo: HTMLVideoElement | null = null;

    const onStalled = () => {
      console.warn('[Web Video] Evento stalled detectado no elemento nativo.');
      if (mainHlsInstanceRef.current) {
        try {
          mainHlsInstanceRef.current.startLoad();
        } catch {}
      }
    };
    const onWaiting = () => {
      setIsBuffering(true);
    };
    const onPlaying = () => {
      setIsBuffering(false);
      lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
      lastPlaybackCheckRef.current.recoveryAttempts = 0;
    };

    const checkAndPrepareWebVideo = () => {
      const videoEl = document.querySelector('video');
      if (!videoEl) return;

      if (videoEl !== registeredVideo) {
        if (registeredVideo) {
          registeredVideo.removeEventListener('stalled', onStalled);
          registeredVideo.removeEventListener('waiting', onWaiting);
          registeredVideo.removeEventListener('playing', onPlaying);
        }
        registeredVideo = videoEl;
        videoEl.addEventListener('stalled', onStalled);
        videoEl.addEventListener('waiting', onWaiting);
        videoEl.addEventListener('playing', onPlaying);
      }

      videoEl.preload = 'auto';
      videoEl.playsInline = true;
      videoEl.style.transform = 'translateZ(0)';
      (videoEl.style as any).webkitTransform = 'translateZ(0)';
      videoEl.style.willChange = 'transform';
      videoEl.style.backfaceVisibility = 'hidden';
      (videoEl.style as any).webkitBackfaceVisibility = 'hidden';

      if (initialTime > 2 && !applied && !hasAppliedInitialTimeRef.current) {
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
      if (registeredVideo) {
        registeredVideo.removeEventListener('stalled', onStalled);
        registeredVideo.removeEventListener('waiting', onWaiting);
        registeredVideo.removeEventListener('playing', onPlaying);
      }
    };
  }, [initialTime, player]);

  // Web HLS Playback Engine para Canais Ao Vivo
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const isLiveOrHls = (type === 'live' || currentStreamUrl.includes('.m3u8')) && !currentStreamUrl.includes('.mp4');
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

      const Hls = getHls();
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
            manifestLoadingMaxRetry: 6,
            manifestLoadingRetryDelay: 1000,
            levelLoadingTimeOut: 20000,
            levelLoadingMaxRetry: 6,
            levelLoadingRetryDelay: 1000,
            fragLoadingTimeOut: 25000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            appendErrorMaxRetry: 6,
            nudgeOffset: 0.15,
            nudgeMaxRetry: 8,
            maxBufferHole: 0.6,
            highBufferWatchdogPeriod: 2,
          });

          mainHlsInstanceRef.current = hlsInstance;
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
              try {
                if (videoEl && !videoEl.paused) {
                  videoEl.currentTime += 0.15;
                }
              } catch {}
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

    attachHls();

    return () => {
      isCancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch {}
        mainHlsInstanceRef.current = null;
      }
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const videoEls = document.querySelectorAll('video');
          videoEls.forEach((el) => {
            try {
              el.pause();
              el.src = '';
              el.removeAttribute('src');
              el.load();
            } catch {}
          });
        } catch {}
      }
    };
  }, [currentStreamUrl, type]);

  // Liberação agressiva de conexões e sockets IPTV no navegador Web ao fechar aba ou sair do player
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleWebUnload = () => {
      if (mainHlsInstanceRef.current) {
        try {
          mainHlsInstanceRef.current.destroy();
          mainHlsInstanceRef.current = null;
        } catch {}
      }
      try {
        if (typeof document !== 'undefined') {
          const videoEls = document.querySelectorAll('video');
          videoEls.forEach((el) => {
            try {
              el.pause();
              el.src = '';
              el.removeAttribute('src');
              el.load();
            } catch {}
          });
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleWebUnload);
    window.addEventListener('pagehide', handleWebUnload);

    return () => {
      window.removeEventListener('beforeunload', handleWebUnload);
      window.removeEventListener('pagehide', handleWebUnload);
      handleWebUnload();
    };
  }, []);

  // Reseta timestamps do watchdog sempre que a URL do stream mudar
  useEffect(() => {
    lastPlaybackCheckRef.current.mountTimestamp = Date.now();
    lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
    lastPlaybackCheckRef.current.recoveryAttempts = 0;
  }, [currentStreamUrl]);

  // Playback Stall Watchdog & Auto-Recovery Engine (Web & Mobile)
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      // Se estiver transmitindo para a TV (Cast), pausado pelo usuário, tela bloqueada, ou erro crítico: reseta contadores e NUNCA tenta auto-recuperar no celular!
      if (isCasting || !isPlaying || isScreenLocked || playbackError) {
        lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
        lastPlaybackCheckRef.current.recoveryAttempts = 0;
        return;
      }

      // Período de carência inicial: Durante os primeiros 8s após início ou troca de stream,
      // o player está negociando conexão, TLS, headers, buffers iniciais e busca de trilhas.
      // Nunca dispara recuperação de estagnação nesta janela inicial.
      const timeSinceMount = Date.now() - (lastPlaybackCheckRef.current.mountTimestamp || 0);
      if (timeSinceMount < 8000) {
        lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
        lastPlaybackCheckRef.current.recoveryAttempts = 0;
        return;
      }

      const curPos = currentTimeRef.current;
      const prevPos = lastPlaybackCheckRef.current.time;
      const progressDelta = Math.abs(curPos - prevPos);

      // Se o vídeo avançou normalmente (pelo menos 0.1s): está saudável!
      if (progressDelta >= 0.1) {
        lastPlaybackCheckRef.current.time = curPos;
        lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
        lastPlaybackCheckRef.current.recoveryAttempts = 0;
        setIsBuffering(false);
        return;
      }

      // Se não avançou, quanto tempo está estagnado?
      const stuckDurationMs = Date.now() - lastPlaybackCheckRef.current.lastChangeTimestamp;

      // Após 2.5s sem progresso, exibe o indicador visual de buffering
      if (stuckDurationMs >= 2500 && !isBuffering) {
        setIsBuffering(true);
      }

      // Limiar dinâmico para auto-recuperação:
      // Se estiver em buffer ativo / carregamento de rede (player.status === 'loading' ou isBuffering),
      // concede até 12s para não abortar downloads de chunks em andamento.
      // Se o player afirma estar pronto (status 'readyToPlay' e não-buffering) mas travou na imagem,
      // dispara após 7s.
      const isPlayerBuffering = isBuffering || player.status === 'loading';
      const recoveryThresholdMs = isPlayerBuffering ? 12000 : 7000;

      if (stuckDurationMs >= recoveryThresholdMs) {
        lastPlaybackCheckRef.current.recoveryAttempts += 1;
        const attempt = lastPlaybackCheckRef.current.recoveryAttempts;
        lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();

        console.warn(
          `[Playback Watchdog] Vídeo estagnado em ${curPos.toFixed(1)}s (tentativa ${attempt}). Executando auto-recuperação...`
        );

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const videoEl = document.querySelector('video');
          const isLiveOrHls = type === 'live' || currentStreamUrl.includes('.m3u8');

          if (isLiveOrHls) {
            // Canal ao Vivo / HLS
            if (mainHlsInstanceRef.current) {
              try {
                mainHlsInstanceRef.current.startLoad();
                if (attempt >= 2) {
                  mainHlsInstanceRef.current.recoverMediaError();
                }
              } catch {}
            }
            if (videoEl) {
              try {
                videoEl.currentTime += 0.2;
                videoEl.play().catch(() => {});
              } catch {}
            }
          } else {
            // VOD (Filmes e Séries)
            if (videoEl) {
              try {
                if (attempt === 1) {
                  videoEl.currentTime = curPos + 0.1;
                  videoEl.play().catch(() => {});
                } else {
                  console.warn(`[Watchdog VOD] Reconectando stream em ${curPos.toFixed(1)}s sem recarregar a página`);
                  videoEl.src = currentStreamUrl;
                  videoEl.currentTime = Math.max(0, curPos);
                  videoEl.load();
                  videoEl.play().catch(() => {});
                  try {
                    player.currentTime = Math.max(0, curPos);
                  } catch {}
                }
              } catch (e) {
                console.warn('[Watchdog Web] Falha na auto-recuperação de VOD:', e);
              }
            }
          }
        } else {
          // Mobile (Expo Video)
          try {
            if (attempt === 1) {
              player.play();
            } else {
              // Nudge de +0.2s para saltar frame corrompido / timestamp PTS travado
              player.currentTime = curPos + 0.2;
              player.play();
            }
          } catch {}
        }
      }
    }, 1500);

    return () => {
      clearInterval(watchdogInterval);
    };
  }, [isCasting, isPlaying, isScreenLocked, playbackError, type, currentStreamUrl, player, isBuffering]);

  useEffect(() => {
    if (isCasting) return;
    try {
      player.muted = false;
      player.volume = 1.0;
      player.audioMixingMode = 'doNotMix';
      player.keepScreenOnWhilePlaying = true;
    } catch {
      // ignore
    }
  }, [player, isCasting]);

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
      if (type === 'live' || isCatchup) return;
      const pct = calculatePercentage(time, totalDur);
      const titleToSave = type === 'series' ? cleanEpisodeDisplayTitle(title) : title;
      saveProgress({
        id: contentId,
        seriesId,
        title: titleToSave,
        posterUrl: posterUrl || '',
        type,
        seasonNumber,
        episodeNumber,
        currentTime: Math.floor(time),
        duration: Math.floor(totalDur),
        percentage: pct >= 95 ? 100 : pct,
        updatedAt: Date.now(),
        streamUrl: extractDirectUrl(streamUrl),
      });
    },
    [contentId, seriesId, title, posterUrl, type, seasonNumber, episodeNumber, streamUrl, saveProgress, isCatchup]
  );

  // Garante que o episódio atualmente aberto na tela seja o exibido no Continuar Assistindo
  useEffect(() => {
    if (type === 'series' && contentId) {
      const existing = getProgress(contentId);
      const titleToSave = cleanEpisodeDisplayTitle(title);
      saveProgress({
        id: contentId,
        seriesId,
        title: titleToSave,
        posterUrl: posterUrl || '',
        type: 'series',
        seasonNumber,
        episodeNumber,
        currentTime: initialTime > 2 ? initialTime : 0,
        duration: existing?.duration || 0,
        percentage: initialTime > 2 && existing?.percentage && existing.percentage < 95 ? existing.percentage : 1,
        updatedAt: Date.now(),
        streamUrl: extractDirectUrl(streamUrl),
      });
    }
  }, [contentId, seriesId, title, type, posterUrl, seasonNumber, episodeNumber, initialTime, streamUrl, saveProgress, getProgress]);

  const isNavigatingEpisodeRef = useRef(false);

  const handleGoToNextEpisode = useCallback(() => {
    if (!nextEpisode || isNavigatingEpisodeRef.current) return;
    isNavigatingEpisodeRef.current = true;

    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);

    // 1. Marca o episódio que acabou como 100% concluído para sair do Continuar Assistindo
    if (contentId) {
      saveProgress({
        id: contentId,
        seriesId,
        title: cleanEpisodeDisplayTitle(title),
        posterUrl: posterUrl || '',
        type: 'series',
        seasonNumber,
        episodeNumber,
        currentTime: dur > 0 ? Math.floor(dur) : Math.floor(cur),
        duration: dur > 0 ? Math.floor(dur) : Math.floor(cur),
        percentage: 100,
        updatedAt: Date.now() - 1000,
        streamUrl,
      });
    }

    // 2. Registra o próximo episódio imediatamente como ativo com o título correto
    const nextTitle = cleanEpisodeDisplayTitle(nextEpisode.title);
    saveProgress({
      id: nextEpisode.id,
      seriesId,
      title: nextTitle,
      posterUrl: nextEpisode.posterUrl || posterUrl || '',
      type: 'series',
      seasonNumber: nextEpisode.seasonNumber,
      episodeNumber: nextEpisode.episodeNumber,
      currentTime: 1,
      duration: 0,
      percentage: 1,
      updatedAt: Date.now() + 1000,
      streamUrl: nextEpisode.streamUrl,
    });

    navigation.replace('PlayerScreen', {
      streamUrl: nextEpisode.streamUrl,
      title: nextTitle,
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
    contentId,
    seriesId,
    title,
    posterUrl,
    seasonNumber,
    episodeNumber,
    streamUrl,
    saveProgress,
    navigation,
    episodesList,
  ]);

  const handleConfirmNextEpisode = useCallback(() => {
    setShowNextEpisodePrompt(false);
    showNextEpisodePromptRef.current = false;
    if (!hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true;
      handleGoToNextEpisode();
    }
  }, [handleGoToNextEpisode]);

  const handleCancelNextEpisode = useCallback(() => {
    setShowNextEpisodePrompt(false);
    showNextEpisodePromptRef.current = false;
    setNextEpisodeDismissed(true);
    nextEpisodeDismissedRef.current = true;
  }, []);

  // Na TV a contagem segue a posição do episódio (os timers param com a tela do celular apagada)
  useEffect(() => {
    if (!showNextEpisodePrompt || isCasting) return;

    const interval = setInterval(() => {
      setNextEpisodeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowNextEpisodePrompt(false);
          showNextEpisodePromptRef.current = false;
          if (!hasAutoAdvancedRef.current) {
            hasAutoAdvancedRef.current = true;
            handleGoToNextEpisodeRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showNextEpisodePrompt, isCasting]);

  useEffect(() => {
    setShowNextEpisodePrompt(false);
    showNextEpisodePromptRef.current = false;
    setNextEpisodeDismissed(false);
    nextEpisodeDismissedRef.current = false;
    isNavigatingEpisodeRef.current = false;
    hasCastAutoAdvancedRef.current = false;
    hasCastStartedPlayingRef.current = false;
    maxCastPositionObservedRef.current =
      typeof effectiveInitialTime === 'number' && effectiveInitialTime > 0 ? effectiveInitialTime : 0;
    currentTimeRef.current = effectiveInitialTime;
    setCurrentTime(effectiveInitialTime);
    hasCastRef.current = false;
    setCastError(null);
  }, [contentId, effectiveInitialTime]);

  const handleGoToPrevEpisode = useCallback(() => {
    if (!prevEpisode || isNavigatingEpisodeRef.current) return;
    isNavigatingEpisodeRef.current = true;

    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }

    // Registra o episódio anterior imediatamente como o ativo
    const prevTitle = cleanEpisodeDisplayTitle(prevEpisode.title);
    saveProgress({
      id: prevEpisode.id,
      seriesId,
      title: prevTitle,
      posterUrl: prevEpisode.posterUrl || posterUrl || '',
      type: 'series',
      seasonNumber: prevEpisode.seasonNumber,
      episodeNumber: prevEpisode.episodeNumber,
      currentTime: 1,
      duration: 0,
      percentage: 1,
      updatedAt: Date.now() + 1000,
      streamUrl: prevEpisode.streamUrl,
    });

    navigation.replace('PlayerScreen', {
      streamUrl: prevEpisode.streamUrl,
      title: prevTitle,
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
    saveProgress,
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
      if (isCastingRef.current) {
        if (player.playing) {
          try {
            player.pause();
            player.muted = true;
            player.volume = 0;
          } catch {}
        }
        return;
      }

      if (typeof event.currentTime === 'number' && Number.isFinite(event.currentTime)) {
        if (initialTime > 2 && !hasAppliedInitialTimeRef.current) {
          hasAppliedInitialTimeRef.current = true;
          try {
            player.currentTime = initialTime;
          } catch {}
        }

        currentTimeRef.current = event.currentTime;

        // Otimização crucial para 60/120Hz no Web:
        // Só dispara re-renderização do React se os controles estiverem visíveis na tela.
        // Quando os controles estão ocultos, zera o consumo de CPU da thread principal,
        // garantindo que o vídeo rode com fluidez máxima de 60/120 FPS sem perda de quadros.
        if (showControlsRef.current) {
          setCurrentTime(event.currentTime);
        }

        // Notificação automática de Próximo Episódio nos últimos 25 segundos
        if (
          type === 'series' &&
          nextEpisodeRef.current &&
          player.duration > 30 &&
          event.currentTime >= player.duration - 25 &&
          !hasAutoAdvancedRef.current &&
          !nextEpisodeDismissedRef.current
        ) {
          if (!showNextEpisodePromptRef.current) {
            showNextEpisodePromptRef.current = true;
            setShowNextEpisodePrompt(true);
            const remaining = Math.max(1, Math.floor(player.duration - event.currentTime));
            setNextEpisodeCountdown(Math.min(15, remaining));
          }
        }

        if (
          type === 'series' &&
          nextEpisodeRef.current &&
          player.duration > 15 &&
          event.currentTime >= player.duration - 1.5 &&
          !hasAutoAdvancedRef.current &&
          !nextEpisodeDismissedRef.current
        ) {
          hasAutoAdvancedRef.current = true;
          setShowNextEpisodePrompt(false);
          showNextEpisodePromptRef.current = false;
          handleGoToNextEpisodeRef.current();
        }
      }
      if (player.duration > 0 && Number.isFinite(player.duration)) {
        durationRef.current = player.duration;
        setDuration(player.duration);
      }
    });
    const subPlaying = player.addListener('playingChange', (event) => {
      if (isCastingRef.current && event.isPlaying) {
        try {
          player.pause();
          player.muted = true;
          player.volume = 0;
        } catch {}
        setIsPlaying(false);
        return;
      }
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        setIsBuffering(false);
      }
    });
    const subStatus = player.addListener('statusChange', (event) => {
      // Ignorar eventos do player local enquanto estiver transmitindo na TV
      if (isCastingRef.current) {
        return;
      }
      setIsBuffering(event.status === 'loading');
      if (event.status === 'error') {
        if (Platform.OS === 'web' && type === 'live') {
          return;
        }
        if (type === 'live' && !attemptedAlternativeRef.current) {
          const altUrl = xtreamService.getAlternativeLiveStreamUrl(currentStreamUrl);
          const isNotSupportedOnIos = Platform.OS === 'ios' && !!altUrl?.includes('.ts');
          if (altUrl && !isNotSupportedOnIos) {
            attemptedAlternativeRef.current = true;
            setCurrentStreamUrl(altUrl);
            safeReplacePlayerSource(player, {
              uri: altUrl,
              contentType: (altUrl.includes('.m3u8') ? 'hls' : 'auto') as any,
              useCaching: false,
              headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                Accept: '*/*',
              },
            });
            if (!isCastingRef.current) {
              player.play();
            }
            return;
          }
        }
        setPlaybackError(
          'Não foi possível reproduzir este conteúdo. Verifique sua conexão ou se o canal está ativo.'
        );

        // Se houver conta conectada, consulta status de conexões ativas no painel IPTV
        if (account) {
          xtreamService
            .authenticate(account)
            .then((authData) => {
              if (authData?.user_info) {
                storageService.saveUserInfo(authData.user_info);
                const activeCons = parseInt(authData.user_info.active_cons || '0', 10);
                const maxCons = parseInt(authData.user_info.max_connections || '1', 10);
                if (activeCons >= maxCons && maxCons > 0) {
                  setPlaybackError(
                    `Sua conta IPTV consta em uso em outro dispositivo (${activeCons}/${maxCons} telas). Feche o Chrome ou a TV e toque em "Reconectar Lista" para assistir aqui no celular.`
                  );
                }
              }
            })
            .catch(() => {});
        }
      } else if (event.status === 'readyToPlay') {
        setIsBuffering(false);
        lastPlaybackCheckRef.current.lastChangeTimestamp = Date.now();
        lastPlaybackCheckRef.current.recoveryAttempts = 0;
        setPlaybackError(null);
        if (player.duration > 0 && Number.isFinite(player.duration)) {
          setDuration(player.duration);
        }
        if (initialTime > 2 && !hasAppliedInitialTimeRef.current) {
          hasAppliedInitialTimeRef.current = true;
          try {
            player.currentTime = initialTime;
            setCurrentTime(initialTime);
          } catch (e) {
            console.warn('[Player] Falha ao aplicar initialTime no readyToPlay:', e);
          }
        }
        // Iniciar reprodução automaticamente apenas se NÃO estiver no Cast
        if (!isCastingRef.current && !player.playing) {
          try {
            player.play();
          } catch {
            // Em navegadores com restrição estrita de som, tentar com mute se bloqueado
            try {
              player.muted = true;
              player.play();
            } catch {
              // ignore
            }
          }
        } else if (isCastingRef.current) {
          try {
            player.pause();
            player.muted = true;
            player.volume = 0;
          } catch {}
        }
      }
    });
    const subEnd = (player as any).addListener?.('playToEnd', () => {
      // Ignorar eventos do player local enquanto estiver transmitindo na TV
      if (isCastingRef.current) {
        return;
      }
      if (sleepTimerRef.current === 'end') {
        try {
          player.pause();
        } catch {}
        setSleepTimer('off');
        sleepTimerRef.current = 'off';
        Alert.alert(
          'Temporizador para Dormir',
          'O vídeo terminou e a reprodução foi pausada conforme configurado no temporizador.'
        );
        return;
      }
      if (type === 'series' && nextEpisodeRef.current && !hasAutoAdvancedRef.current) {
        hasAutoAdvancedRef.current = true;
        setShowNextEpisodePrompt(false);
        showNextEpisodePromptRef.current = false;
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

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setPlaybackError(null);
    attemptedAlternativeRef.current = false;
    prefetchService.clearPrefetchCache();

    // 1. Força reautenticação com o servidor Xtream para desobstruir conexões no painel IPTV
    if (account) {
      try {
        const authData = await xtreamService.authenticate(account);
        if (authData?.user_info) {
          storageService.saveUserInfo(authData.user_info);
          const activeCons = parseInt(authData.user_info.active_cons || '0', 10);
          const maxCons = parseInt(authData.user_info.max_connections || '1', 10);
          if (activeCons >= maxCons && maxCons > 0) {
            setPlaybackError(
              `Sua conta IPTV continua em uso em outro dispositivo (${activeCons}/${maxCons} telas). Feche o Chrome ou a TV e aguarde alguns segundos antes de tentar novamente.`
            );
            setIsRetrying(false);
            return;
          }
        }
      } catch (authErr) {
        console.warn('[Player] Falha ao reautenticar durante retry:', authErr);
      }
    }

    setCurrentStreamUrl(streamUrl);
    try {
      safeReplacePlayerSource(player, {
        uri: streamUrl,
        headers: {
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
          Accept: '*/*',
        },
      });
      if (!isCastingRef.current) {
        player.play();
      }
    } catch (playErr) {
      console.warn('[Player] Erro ao substituir stream no retry:', playErr);
    } finally {
      setIsRetrying(false);
    }
  }, [player, streamUrl, account]);

  useProgressPersistence({
    isPlaying: isCasting ? isCastPlaying : isPlaying,
    getSnapshot: () =>
      isCastingRef.current
        ? { time: streamPosition, duration: streamDuration }
        : { time: currentTimeRef.current, duration: durationRef.current || duration },
    persist: persistCurrentProgress,
  });

  // Monitorar reprodução real do episódio atual no Chromecast
  useEffect(() => {
    if (!isCasting || type !== 'series') return;

    // Verificar se a mídia no Chromecast é de fato a deste episódio
    const isCurrentEpisodeActive =
      !activeCastMedia ||
      activeCastMedia.contentId === contentId ||
      extractDirectUrl(activeCastMedia.streamUrl) === extractDirectUrl(streamUrl);

    if (isCurrentEpisodeActive) {
      if (streamPosition > 0) {
        maxCastPositionObservedRef.current = Math.max(
          maxCastPositionObservedRef.current,
          streamPosition
        );
      }
      if (streamPosition > 10 && streamDuration > 30 && (isCastPlaying || streamPosition > 20)) {
        hasCastStartedPlayingRef.current = true;
      }
    }
  }, [
    isCasting,
    type,
    contentId,
    streamUrl,
    activeCastMedia,
    streamPosition,
    streamDuration,
    isCastPlaying,
  ]);

  // Próximo episódio na TV: aviso nos últimos segundos e troca com o episódio atual ainda tocando.
  // Segue a posição informada pela TV, que continua chegando com a tela do celular apagada
  useEffect(() => {
    if (
      !isCasting ||
      type !== 'series' ||
      !nextEpisode ||
      hasCastAutoAdvancedRef.current ||
      nextEpisodeDismissed
    ) {
      return;
    }

    // 1. Duração mínima válida: episódio de série real na TV deve ter mais de 60 segundos
    if (!streamDuration || streamDuration < 60) {
      return;
    }

    // 2. Só permite avançar se o episódio DE FATO começou e progrediu na TV durante esta sessão
    if (!hasCastStartedPlayingRef.current) {
      return;
    }

    // 3. Critérios estritos de finalização:
    // a) Chegou a hora da troca, ainda com o episódio tocando
    const advanceAt = streamDuration - CAST_NEXT_ADVANCE_BEFORE_END_S;
    const isNearEnd = streamPosition >= advanceAt;

    // b) OU receptor Chromecast reportou término explícito (idleReason 'finished' ou 1)
    // E confirmamos que o usuário assistiu pelo menos 85% do episódio (evita falsos positivos em erros/cancelamentos)
    const isFinishedOnCast =
      (castMediaStatus?.idleReason === 'finished' || castMediaStatus?.idleReason === 1) &&
      maxCastPositionObservedRef.current >= streamDuration * 0.85;

    if (isNearEnd || isFinishedOnCast) {
      const now = Date.now();
      // Cooldown global estrito de 15 segundos entre quaisquer trocas automáticas de episódio
      if (now - globalLastAdvanceTimestamp < 15000) {
        return;
      }
      globalLastAdvanceTimestamp = now;
      globalLastAdvancedId = nextEpisode.id;

      hasCastAutoAdvancedRef.current = true;
      hasAutoAdvancedRef.current = true;
      showNextEpisodePromptRef.current = false;
      setShowNextEpisodePrompt(false);
      handleGoToNextEpisode();
      return;
    }

    if (streamPosition >= streamDuration - CAST_NEXT_PROMPT_BEFORE_END_S) {
      showNextEpisodePromptRef.current = true;
      setShowNextEpisodePrompt(true);
      setNextEpisodeCountdown(Math.max(1, Math.ceil(advanceAt - streamPosition)));
    }
  }, [
    isCasting,
    type,
    nextEpisode,
    nextEpisodeDismissed,
    streamDuration,
    streamPosition,
    castMediaStatus,
    handleGoToNextEpisode,
  ]);

  // Gerenciar transição de desconexão da TV para retomar no celular
  useEffect(() => {
    if (prevIsCastingRef.current && !isCasting) {
      isDisconnectingCastRef.current = true;
      setIsPlaying(true);
      try {
        player.muted = false;
        player.volume = 1.0;
      } catch {}
      if (player.status === 'error') {
        safeReplacePlayerSource(player, videoSource);
      }
      const resumePos = lastCastPositionRef.current || streamPosition;
      if (resumePos > 0) {
        try {
          player.currentTime = resumePos;
          setCurrentTime(resumePos);
        } catch {
          // ignore
        }
      }
      try {
        player.play();
      } catch {
        // ignore
      }
    } else if (!prevIsCastingRef.current && isCasting) {
      isDisconnectingCastRef.current = false;
    }
    prevIsCastingRef.current = isCasting;
  }, [isCasting, streamPosition, player, videoSource]);

  // Transmitir mídia para a TV quando o Cast estiver conectado e garantir silenciamento local total
  useEffect(() => {
    if (isCasting && !isDisconnectingCastRef.current) {
      setIsPlaying(false);
      try {
        player.pause();
        player.muted = true;
        player.volume = 0;
      } catch {
        // ignore
      }

      // Se for Web, silencia e pausa qualquer elemento <video> nativo da página
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const videoEls = document.querySelectorAll('video');
          videoEls.forEach((v) => {
            v.pause();
            v.muted = true;
          });
          if (mainHlsInstanceRef.current) {
            mainHlsInstanceRef.current.stopLoad();
          }
        } catch {}
      }

      if (!hasCastRef.current) {
        hasCastRef.current = true;

        // Se a mídia já estiver ativa E DE FATO reproduzindo/carregando no Chromecast
        // (ex: reabrindo pelo MiniPlayer enquanto a TV está tocando), não reinicia o buffer!
        // Mas se a TV estiver ociosa (idle), pausada no início ou sem reprodução ativa,
        // DEVEMOS carregar a mídia no Chromecast!
        const isActuallyActiveOnCast =
          (isCastPlaying || isCastBuffering || (isCastPaused && streamPosition > 2)) &&
          castMediaStatus?.playerState !== 'idle' &&
          castMediaStatus?.idleReason !== 'finished';

        const isSameMedia =
          activeCastMedia &&
          (activeCastMedia.contentId === contentId ||
            activeCastMedia.streamUrl === streamUrl ||
            extractDirectUrl(activeCastMedia.streamUrl) === extractDirectUrl(streamUrl) ||
            (activeCastMedia.title === title && activeCastMedia.type === type));

        if (isActuallyActiveOnCast && isSameMedia) {
          return;
        }

        castMedia({
          streamUrl: extractDirectUrl(streamUrl),
          title,
          posterUrl,
          type,
          contentId,
          seriesId,
          seasonNumber,
          episodeNumber,
          initialTime: effectiveInitialTime,
        }).catch((err) => {
            // Não recarrega sozinho: o vídeo reabria e falhava em ciclo na TV.
            // Uma nova tentativa fica no botão "Tentar Novamente na TV"
            console.warn('Erro ao carregar mídia no Chromecast:', err);
            const message = describeCastFailure(err);
            setCastError(message);
            if (!isCastingRef.current || isDisconnectingCastRef.current) {
              return;
            }
            Alert.alert('Erro na Transmissão', message);
          });
      }
    } else if (!isCasting) {
      hasCastRef.current = false;
      setCastError(null);
    }
  }, [
    isCasting,
    activeCastMedia,
    castMediaStatus,
    isCastPlaying,
    isCastBuffering,
    isCastPaused,
    streamPosition,
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

  // A TV aceitou o vídeo, mas parou com erro (ex.: áudio 5.1 ou HEVC): antes a tela seguia
  // dizendo "Reproduzindo no Chromecast" com a TV parada
  const castStatusContentId = castMediaStatus?.mediaInfo?.customData?.id;
  const isCastErrorHere =
    isCasting &&
    castMediaStatus?.playerState === 'idle' &&
    castMediaStatus?.idleReason === 'error' &&
    (castStatusContentId
      ? String(castStatusContentId) === String(activeContentId)
      : !activeCastMedia || activeCastMedia.contentId === activeContentId);

  useEffect(() => {
    if (isCastErrorHere) {
      setCastError(CAST_UNSUPPORTED_MESSAGE);
    }
  }, [isCastErrorHere]);

  useEffect(() => {
    if (isCastPlaying) {
      setCastError(null);
    }
  }, [isCastPlaying]);

  const handleBack = useCallback(() => {
    const cur = isCasting ? streamPosition : (player.currentTime || currentTime);
    const dur = isCasting ? streamDuration : (duration || player.duration || 0);
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }

    // Se estiver no Chrome/Web reproduzindo vídeo local, descolar para Picture-in-Picture flutuante
    if (Platform.OS === 'web' && !isCasting && typeof document !== 'undefined') {
      try {
        const videoEl = document.querySelector('video') as HTMLVideoElement | null;
        if (
          videoEl &&
          document.pictureInPictureEnabled &&
          document.pictureInPictureElement !== videoEl &&
          !videoEl.paused
        ) {
          videoEl.requestPictureInPicture?.().catch(() => {});
        }
      } catch {
        // ignore
      }
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

  const performPreviewSeek = useCallback(
    (timeSecs: number) => {
      const v = previewVideoRef.current;
      if (!v) {
        pendingPreviewSeekRef.current = timeSecs;
        return;
      }

      const dur =
        duration && Number.isFinite(duration) && duration > 0
          ? duration
          : v.duration && Number.isFinite(v.duration) && v.duration > 0
          ? v.duration
          : 0;

      const target = dur > 0 ? Math.max(0, Math.min(dur - 0.5, timeSecs)) : Math.max(0, timeSecs);

      if (v.readyState < 1) {
        pendingPreviewSeekRef.current = target;
        const onMeta = () => {
          try {
            v.pause();
            if (pendingPreviewSeekRef.current !== null) {
              const next = pendingPreviewSeekRef.current;
              pendingPreviewSeekRef.current = null;
              if ('fastSeek' in v && typeof v.fastSeek === 'function') {
                v.fastSeek(next);
              } else {
                v.currentTime = next;
              }
            }
          } catch {}
        };
        v.addEventListener('loadedmetadata', onMeta, { once: true });
        return;
      }

      try {
        v.pause();
      } catch {}

      if (!v.seeking) {
        try {
          if ('fastSeek' in v && typeof v.fastSeek === 'function') {
            v.fastSeek(target);
          } else {
            v.currentTime = target;
          }
        } catch {
          // ignore
        }
      } else {
        pendingPreviewSeekRef.current = target;
      }
    },
    [duration]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !hoverScrub) return;
    performPreviewSeek(hoverScrub.timeSecs);
  }, [hoverScrub?.timeSecs, performPreviewSeek]);

  // Suporte a HLS (.m3u8) no preview de timeline para Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (type === 'live') return;
    if (!currentStreamUrl.includes('.m3u8')) return;

    let hlsPreview: any = null;
    let isCancelled = false;

    const initHlsPreview = () => {
      if (isCancelled) return;
      const v = previewVideoRef.current;
      if (!v) return;

      const Hls = getHls();
      if (Hls && Hls.isSupported()) {
        try {
          if (hlsPreview) hlsPreview.destroy();
          hlsPreview = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
          });
          hlsPreview.loadSource(currentStreamUrl);
          hlsPreview.attachMedia(v);
          hlsPreview.on(Hls.Events.MANIFEST_PARSED, () => {
            v.pause();
            if (pendingPreviewSeekRef.current !== null) {
              const next = pendingPreviewSeekRef.current;
              pendingPreviewSeekRef.current = null;
              v.currentTime = next;
            }
          });
        } catch {}
      }
    };

    initHlsPreview();

    return () => {
      isCancelled = true;
      if (hlsPreview) {
        hlsPreview.destroy();
      }
    };
  }, [currentStreamUrl, type]);

  const handleProgressBarHover = useCallback(
    (data: IProgressBarHoverData | null) => {
      if (!data) {
        setHoverScrub(null);
        return;
      }
      const totalDur =
        duration && Number.isFinite(duration)
          ? duration
          : player.duration && Number.isFinite(player.duration)
          ? player.duration
          : 0;
      if (totalDur <= 0) return;
      const timeSecs = Math.round((data.percentage / 100) * totalDur);
      setHoverScrub({
        percentage: data.percentage,
        clientX: data.clientX,
        timeSecs,
      });

      if (Platform.OS === 'web') {
        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = setTimeout(() => {
          performPreviewSeek(timeSecs);
        }, 30);
      }
    },
    [duration, player, performPreviewSeek]
  );

  const handleBackgroundPress = useCallback(
    (e?: any) => {
      const native = e?.nativeEvent || e || {};
      const now = Date.now();
      const x =
        native.locationX ??
        native.pageX ??
        native.clientX ??
        (screenWidth > 0 ? screenWidth / 2 : 200);
      const w = screenWidth > 0 ? screenWidth : 400;
      const pctX = (x / w) * 100;

      const lastTap = lastTapRef.current;
      const delta = lastTap ? now - lastTap.time : Infinity;

      // Check if this is a genuine double tap: within 380ms, on the same side
      if (lastTap && delta <= 380) {
        const lastPctX = (lastTap.x / w) * 100;
        lastTapRef.current = null;

        // Double tap on left side (rewind 10s)
        if (pctX <= 40 && lastPctX <= 45) {
          handleLocalSeek(-10);
          setDoubleTapSide('left');
          if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
          doubleTapTimerRef.current = setTimeout(() => setDoubleTapSide(null), 650);

          // If controls were hidden before the double tap, keep them hidden so only ripple shows
          if (wasControlsHiddenOnFirstTapRef.current) {
            setShowControls(false);
          }
          return;
        }

        // Double tap on right side (forward 10s)
        if (pctX >= 60 && lastPctX >= 55) {
          handleLocalSeek(10);
          setDoubleTapSide('right');
          if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
          doubleTapTimerRef.current = setTimeout(() => setDoubleTapSide(null), 650);

          // If controls were hidden before the double tap, keep them hidden so only ripple shows
          if (wasControlsHiddenOnFirstTapRef.current) {
            setShowControls(false);
          }
          return;
        }
      }

      // Single tap: record tap position and time
      wasControlsHiddenOnFirstTapRef.current = !showControls;
      lastTapRef.current = { time: now, x };

      // Single tap toggles controls: if controls are shown, hide them; if hidden, show them and start auto-hide countdown
      if (showControls) {
        setShowControls(false);
      } else {
        resetHideTimer();
      }
    },
    [handleLocalSeek, showControls, resetHideTimer, screenWidth]
  );

  const handleTouchStart = useCallback(
    (e?: any) => {
      const native = e?.nativeEvent || e || {};
      const x = native.locationX ?? native.clientX ?? 0;
      const y = native.locationY ?? native.clientY ?? 0;
      const w = screenWidth > 0 ? screenWidth : 400;
      if (x >= w * 0.65) {
        touchStartY.current = y;
        touchStartVol.current = volume;
        isDraggingVolume.current = false;
      } else {
        touchStartY.current = null;
      }
    },
    [screenWidth, volume]
  );

  const handleTouchMove = useCallback(
    (e?: any) => {
      if (touchStartY.current === null) return;
      const native = e?.nativeEvent || e || {};
      const y = native.locationY ?? native.clientY ?? 0;
      const deltaY = touchStartY.current - y;

      if (Math.abs(deltaY) > 15) {
        isDraggingVolume.current = true;
        const h = screenHeight > 0 ? screenHeight : 300;
        const change = deltaY / (h * 0.7);
        const newVol = Math.max(0, Math.min(1, touchStartVol.current + change));
        handleSetVolume(newVol);
      }
    },
    [screenHeight, handleSetVolume]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    if (isDraggingVolume.current) {
      setTimeout(() => {
        isDraggingVolume.current = false;
      }, 120);
    }
  }, []);

  const handlePress = useCallback(
    (e?: any) => {
      if (isDraggingVolume.current) {
        return;
      }
      handleBackgroundPress(e);
    },
    [handleBackgroundPress]
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

  const handleCastPlayOrReload = useCallback(() => {
    if (isCastPlaying) {
      castPause();
      return;
    }
    const isTvActivelyPlaying =
      (isCastPlaying || isCastBuffering || (isCastPaused && streamPosition > 2)) &&
      castMediaStatus?.playerState !== 'idle' &&
      castMediaStatus?.idleReason !== 'finished';

    if (!isTvActivelyPlaying) {
      castMedia({
        streamUrl: extractDirectUrl(streamUrl),
        title,
        posterUrl,
        type,
        contentId,
        seriesId,
        seasonNumber,
        episodeNumber,
        initialTime: streamPosition > 2 ? streamPosition : effectiveInitialTime,
      }).catch((err) => {
        console.warn('[Player] Erro ao recarregar mídia no Chromecast via Play:', err);
        setCastError(describeCastFailure(err));
      });
    } else {
      castPlay();
    }
  }, [
    isCastPlaying,
    castPause,
    isCastBuffering,
    isCastPaused,
    streamPosition,
    castMediaStatus,
    castMedia,
    streamUrl,
    title,
    posterUrl,
    type,
    contentId,
    seriesId,
    seasonNumber,
    episodeNumber,
    effectiveInitialTime,
    castPlay,
  ]);

  const handleTogglePlay = useCallback(() => {
    resetHideTimer();
    if (isCasting) {
      handleCastPlayOrReload();
      return;
    }
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, resetHideTimer, isCasting, handleCastPlayOrReload]);

  // Controles de teclado no computador (Web): Espaço = Play/Pause, Setas = Avançar/Voltar 10s, M = Mudo, F = Tela Cheia, N = Próximo EP, P = EP Anterior
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (isScreenLockedRef.current) {
        if (e.key === 'l' || e.key === 'L' || e.key === 'Escape') {
          e.preventDefault();
          setIsScreenLocked(false);
          isScreenLockedRef.current = false;
          setShowUnlockButton(false);
        }
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
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsScreenLocked(true);
        isScreenLockedRef.current = true;
        setShowControls(false);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        cycleContentFit();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSettingsModal((prev) => !prev);
      } else if ((e.key === 'c' || e.key === 'C') && type === 'live') {
        e.preventDefault();
        setShowChannelDrawer((prev) => !prev);
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
    cycleContentFit,
    handleGoToNextEpisode,
    handleGoToPrevEpisode,
    nextEpisode,
    prevEpisode,
    type,
  ]);

  const handleDisconnectAndPlayLocally = useCallback(() => {
    isDisconnectingCastRef.current = true;
    const resumePos = lastCastPositionRef.current || streamPosition;
    stopCast();
    try {
      player.muted = false;
      player.volume = 1.0;
    } catch {}
    if (resumePos > 0) {
      try {
        player.currentTime = resumePos;
        setCurrentTime(resumePos);
      } catch {}
    }
    try {
      player.play();
    } catch {}
    setIsPlaying(true);
  }, [stopCast, streamPosition, player]);

  const insets = useAppInsets();

  const renderNextEpisodeCard = (style?: ViewStyle) =>
    nextEpisode ? (
      <NextEpisodeContainer testID="next-episode-card" style={style}>
        <NextEpisodeHeader>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="skip-next" size={16} color="#E50914" style={{ marginRight: 4 }} />
            <NextEpisodeCountdown>Próximo em {nextEpisodeCountdown}s</NextEpisodeCountdown>
          </View>
          <FocusableGlobal
            onPress={handleCancelNextEpisode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso de próximo episódio"
          >
            <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </FocusableGlobal>
        </NextEpisodeHeader>
        <NextEpisodeTitle numberOfLines={1}>
          {nextEpisode.title || `Episódio ${nextEpisode.episodeNumber}`}
        </NextEpisodeTitle>
        <NextEpisodeButtonRow>
          <NextEpisodePlayBtn
            onPress={handleConfirmNextEpisode}
            accessibilityRole="button"
            accessibilityLabel="Assistir próximo episódio agora"
            testID="next-episode-play-btn"
          >
            <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
            <NextEpisodePlayBtnText>Assistir Agora</NextEpisodePlayBtnText>
          </NextEpisodePlayBtn>
          <NextEpisodeCancelBtn
            onPress={handleCancelNextEpisode}
            accessibilityRole="button"
            accessibilityLabel="Cancelar próximo episódio"
            testID="next-episode-cancel-btn"
          >
            <NextEpisodeCancelBtnText>Cancelar</NextEpisodeCancelBtnText>
          </NextEpisodeCancelBtn>
        </NextEpisodeButtonRow>
      </NextEpisodeContainer>
    ) : null;

  /* --- CENÁRIO B: Cast Ativo na TV (Controle Remoto) --- */
  if (isCasting) {
    const castPct = calculatePercentage(streamPosition, streamDuration);

    return (
      <RemoteContainer testID="cast-remote-screen">
        <StatusBar hidden={false} animated={true} hideTransitionAnimation="fade" style="light" />
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
            source={{ uri: activePoster || posterUrl }}
            contentFit="cover"
            transition={300}
          />
        </RemoteArtworkWrapper>

        <RemoteInfo>
          <RemoteTitle>{activeTitle}</RemoteTitle>
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
            onPress={handleCastPlayOrReload}
            accessibilityRole="button"
            accessibilityLabel={isCastPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isCastBuffering ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons
                name={isCastPlaying ? 'pause' : 'play-arrow'}
                size={38}
                color="#FFFFFF"
              />
            )}
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

        {showNextEpisodePrompt && renderNextEpisodeCard(CAST_NEXT_EPISODE_CARD_STYLE)}

        {castError && (
          <View
            style={{
              marginHorizontal: 24,
              marginBottom: 16,
              padding: 12,
              backgroundColor: 'rgba(229, 9, 20, 0.2)',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#E50914',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: 13,
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              Erro na Transmissão na TV
            </Text>
            <Text
              style={{
                color: '#CCCCCC',
                fontSize: 12,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              {castError}
            </Text>
            <ButtonGlobal
              label="Tentar Novamente na TV"
              size="sm"
              variant="primary"
              onPress={() => {
                setCastError(null);
                handleCastPlayOrReload();
              }}
            />
          </View>
        )}

        <ButtonGlobal
          label="Assistir no Celular"
          variant="secondary"
          onPress={handleDisconnectAndPlayLocally}
          testID="disconnect-cast-play-locally-button"
        />
      </RemoteContainer>
    );
  }

  /* --- CENÁRIO A: Reprodução Local no Dispositivo --- */
  const localPct = calculatePercentage(currentTime, duration);

  return (
    <Container testID="local-player-screen" showControls={showControls}>
      <StatusBar hidden={true} animated={true} hideTransitionAnimation="fade" style="light" />
      <VideoWrapper
        {...({
          onPointerMove: () => {
            if (Platform.OS === 'web') resetHideTimer();
          },
          onMouseMove: () => {
            if (Platform.OS === 'web') resetHideTimer();
          },
        } as any)}
      >
        <StyledVideo
          ref={videoViewRef}
          player={player}
          contentFit={contentFitMode}
          nativeControls={false}
          allowsPictureInPicture
          startsPictureInPictureAutomatically={canUseSystemPip && !isCasting}
          onPictureInPictureStart={() => {
            setIsInPip(true);
            setShowControls(false);
            setShowSettingsModal(false);
          }}
          onPictureInPictureStop={() => setIsInPip(false)}
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
                  label={isRetrying ? 'Reconectando...' : 'Reconectar e Tentar Novamente'}
                  onPress={handleRetry}
                  variant="primary"
                  size="md"
                  disabled={isRetrying}
                  testID="player-retry-button"
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
        {!isScreenLocked && (
          <BackgroundPressable
            testID="video-background-touch"
            onPress={handlePress}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            focusable={!showControls}
            hasTVPreferredFocus={!showControls}
            {...({
              onPointerMove: () => {
                if (Platform.OS === 'web') resetHideTimer();
              },
              onMouseMove: () => {
                if (Platform.OS === 'web') resetHideTimer();
              },
            } as any)}
          />
        )}

        {/* Double Tap Seek Feedback Ripple (+10s / -10s) */}
        {doubleTapSide && (
          <DoubleTapFeedbackContainer pointerEvents="none" testID="double-tap-feedback-container">
            {doubleTapSide === 'left' && (
              <DoubleTapFeedbackSide side="left">
                <DoubleTapFeedbackCircle>
                  <MaterialIcons name="replay-10" size={34} color="#FFFFFF" />
                  <DoubleTapFeedbackText>-10 segundos</DoubleTapFeedbackText>
                </DoubleTapFeedbackCircle>
              </DoubleTapFeedbackSide>
            )}
            {doubleTapSide === 'right' && (
              <DoubleTapFeedbackSide side="right">
                <DoubleTapFeedbackCircle>
                  <MaterialIcons name="forward-10" size={34} color="#FFFFFF" />
                  <DoubleTapFeedbackText>+10 segundos</DoubleTapFeedbackText>
                </DoubleTapFeedbackCircle>
              </DoubleTapFeedbackSide>
            )}
          </DoubleTapFeedbackContainer>
        )}

        {/* Volume HUD when adjusting volume */}
        {volumeHud?.visible && (
          <VolumeHudContainer pointerEvents="none" testID="volume-hud-container">
            <VolumeHudCard>
              <MaterialIcons
                name={
                  volumeHud.level === 0
                    ? 'volume-off'
                    : volumeHud.level <= 50
                    ? 'volume-down'
                    : 'volume-up'
                }
                size={26}
                color="#FFFFFF"
              />
              <VolumeHudBar>
                <VolumeHudBarFill percentage={volumeHud.level} />
              </VolumeHudBar>
              <VolumeHudText>{volumeHud.level}%</VolumeHudText>
            </VolumeHudCard>
          </VolumeHudContainer>
        )}

        {/* Lock Screen Backdrop when locked */}
        {isScreenLocked && (
          <LockScreenBackdrop
            testID="lock-screen-backdrop"
            activeOpacity={1}
            onPress={handleScreenTouchWhenLocked}
          >
            {showUnlockButton && (
              <UnlockButton
                onPress={handleUnlockScreen}
                testID="unlock-screen-button"
                accessibilityRole="button"
                accessibilityLabel="Desbloquear Tela"
              >
                <MaterialIcons name="lock-open" size={20} color="#E50914" />
                <UnlockButtonText>Desbloquear Tela</UnlockButtonText>
              </UnlockButton>
            )}
          </LockScreenBackdrop>
        )}

        {showControls && !isScreenLocked && (
          <ControlsOverlay pointerEvents="box-none">
            <TopControls insetTop={0} pointerEvents="box-none">
              <ControlButton
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                testID="player-back-button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </ControlButton>
              <PlayerTitle>{activeTitle}</PlayerTitle>
              <TopRightActions pointerEvents="box-none">
                {sleepTimer !== 'off' && (
                  <FocusableGlobal
                    onPress={() => {
                      resetHideTimer();
                      setShowSettingsModal(true);
                    }}
                    testID="sleep-timer-badge"
                    accessibilityRole="button"
                    accessibilityLabel="Temporizador para dormir ativo"
                  >
                    <SleepTimerBadge>
                      <MaterialIcons name="bedtime" size={13} color="#FFFFFF" />
                      <SleepTimerBadgeText>
                        {sleepTimer === 'end'
                          ? 'Fim'
                          : `${Math.ceil((sleepTimerRemainingSecs || 0) / 60)}m`}
                      </SleepTimerBadgeText>
                    </SleepTimerBadge>
                  </FocusableGlobal>
                )}

                {/* Bloqueio de toque não faz sentido no controle remoto */}
                {!Platform.isTV && (
                  <ControlButton
                    onPress={() => {
                      setIsScreenLocked(true);
                      isScreenLockedRef.current = true;
                      setShowControls(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Bloquear tela"
                    testID="lock-screen-button"
                    style={{ marginRight: 8 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="lock-outline" size={22} color="#FFFFFF" />
                  </ControlButton>
                )}

                {type === 'live' && liveChannelsList.length > 0 && (
                  <ControlButton
                    onPress={() => {
                      resetHideTimer();
                      setShowChannelDrawer(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Lista de Canais"
                    testID="channel-drawer-button"
                    style={{ marginRight: 8 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="format-list-bulleted" size={24} color="#FFFFFF" />
                  </ControlButton>
                )}
                {type === 'live' && (
                  <ControlButton
                    onPress={() => {
                      resetHideTimer();
                      setShowEpgModal(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Grade de Programação"
                    testID="epg-modal-button"
                    style={{ marginRight: 8 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialIcons name="event-note" size={24} color="#FFFFFF" />
                  </ControlButton>
                )}
                <ControlButton
                  onPress={handleTogglePip}
                  accessibilityRole="button"
                  accessibilityLabel="Picture in Picture"
                  testID="pip-button"
                  style={{ marginRight: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="picture-in-picture-alt" size={22} color="#FFFFFF" />
                </ControlButton>
                <ControlButton
                  onPress={() => {
                    resetHideTimer();
                    refreshTracks();
                    setShowSettingsModal(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ajustes de Reprodução"
                  testID="settings-modal-button"
                  style={{ marginRight: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="tune" size={22} color="#FFFFFF" />
                </ControlButton>
                <ControlButton
                  onPress={cycleContentFit}
                  accessibilityRole="button"
                  accessibilityLabel={`Proporção: ${contentFitMode}`}
                  testID="aspect-ratio-button"
                  style={{ marginRight: 8 }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons
                    name={
                      contentFitMode === 'contain'
                        ? 'aspect-ratio'
                        : contentFitMode === 'cover'
                        ? 'fit-screen'
                        : 'fullscreen'
                    }
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
                <VolumeControlGroup
                  {...({
                    onMouseEnter: () => setIsVolumeSliderOpen(true),
                    onMouseLeave: () => {
                      if (!isDraggingSliderVolume.current) {
                        setIsVolumeSliderOpen(false);
                      }
                    },
                  } as any)}
                >
                  <ControlButton
                    onPress={handleToggleMute}
                    onLongPress={() => setIsVolumeSliderOpen((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel={isMuted ? 'Ativar som' : `Volume: ${Math.round(volume * 100)}%`}
                    testID="player-mute-button"
                    style={{ marginRight: isVolumeSliderOpen || Platform.OS === 'web' ? 4 : 8 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 0 }}
                  >
                    <MaterialIcons
                      name={volumeIconName}
                      size={22}
                      color="#FFFFFF"
                    />
                  </ControlButton>

                  {(isVolumeSliderOpen || Platform.OS === 'web') && (
                    <View
                      testID="volume-slider-touch"
                      accessibilityRole="adjustable"
                      accessibilityLabel={`Volume: ${Math.round(volume * 100)}%`}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        resetHideTimer();
                        isDraggingSliderVolume.current = true;
                        const vol = calculateVolumeFromEvent(e);
                        handleSetVolume(vol);
                      }}
                      onResponderMove={(e) => {
                        resetHideTimer();
                        const vol = calculateVolumeFromEvent(e);
                        handleSetVolume(vol);
                      }}
                      onResponderRelease={(e) => {
                        resetHideTimer();
                        isDraggingSliderVolume.current = false;
                        const vol = calculateVolumeFromEvent(e);
                        handleSetVolume(vol);
                      }}
                      onResponderTerminate={() => {
                        isDraggingSliderVolume.current = false;
                      }}
                      {...({
                        onPress: handleVolumeTrackClick,
                        onPointerDown: handleVolumePointerDown,
                        onPointerMove: handleVolumePointerMove,
                        onPointerUp: handleVolumePointerUp,
                        onPointerCancel: handleVolumePointerUp,
                      } as any)}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        marginRight: 8,
                        cursor: 'pointer',
                        touchAction: 'none',
                        userSelect: 'none',
                      } as any}
                    >
                      <VolumeSliderTrack ref={volumeTrackRef} pointerEvents="none">
                        <VolumeSliderFill percentage={isMuted ? 0 : volume * 100} pointerEvents="none" />
                        <VolumeSliderThumb percentage={isMuted ? 0 : volume * 100} pointerEvents="none" />
                      </VolumeSliderTrack>
                    </View>
                  )}
                </VolumeControlGroup>
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
                  focusable={showControls}
                  isFocused={focusedPlayerBtn === 'prev'}
                  onFocus={() => {
                    setFocusedPlayerBtn('prev');
                    resetHideTimer();
                  }}
                  onBlur={() => setFocusedPlayerBtn(null)}
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
                  focusable={showControls}
                  isFocused={focusedPlayerBtn === 'seek-back'}
                  onFocus={() => {
                    setFocusedPlayerBtn('seek-back');
                    resetHideTimer();
                  }}
                  onBlur={() => setFocusedPlayerBtn(null)}
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
                focusable={showControls}
                hasTVPreferredFocus={showControls}
                isFocused={focusedPlayerBtn === 'play'}
                onFocus={() => {
                  setFocusedPlayerBtn('play');
                  resetHideTimer();
                }}
                onBlur={() => setFocusedPlayerBtn(null)}
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
                  focusable={showControls}
                  isFocused={focusedPlayerBtn === 'seek-forward'}
                  onFocus={() => {
                    setFocusedPlayerBtn('seek-forward');
                    resetHideTimer();
                  }}
                  onBlur={() => setFocusedPlayerBtn(null)}
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
                  focusable={showControls}
                  isFocused={focusedPlayerBtn === 'next'}
                  onFocus={() => {
                    setFocusedPlayerBtn('next');
                    resetHideTimer();
                  }}
                  onBlur={() => setFocusedPlayerBtn(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="skip-next" size={28} color="#FFFFFF" />
                </SeekButton>
              )}
            </CenterControls>

            <BottomControls pointerEvents="box-none">
              {type !== 'live' ? (
                <>
                  <TimelinePreviewContainer
                  leftPx={Math.max(
                    90,
                    Math.min(
                      (screenWidth || 360) - 90,
                      hoverScrub?.clientX ?? ((screenWidth || 360) / 2)
                    )
                  )}
                  testID={hoverScrub ? 'timeline-preview-tooltip' : undefined}
                  style={{
                    opacity: hoverScrub ? 1 : 0,
                    pointerEvents: 'none',
                  }}
                >
                  <TimelinePreviewCard>
                    <TimelinePreviewVideoWrapper>
                      {posterUrl ? (
                        <ExpoImage
                          source={{ uri: posterUrl }}
                          contentFit="cover"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.85,
                          }}
                        />
                      ) : (
                        <MaterialIcons
                          name="movie"
                          size={32}
                          color="rgba(255, 255, 255, 0.4)"
                        />
                      )}

                      {Platform.OS === 'web' && (
                        <video
                          ref={previewVideoRef}
                          src={currentStreamUrl.includes('.m3u8') ? undefined : currentStreamUrl}
                          muted
                          preload="auto"
                          playsInline
                          onSeeked={() => {
                            if (pendingPreviewSeekRef.current !== null && previewVideoRef.current) {
                              const next = pendingPreviewSeekRef.current;
                              pendingPreviewSeekRef.current = null;
                              try {
                                if (
                                  'fastSeek' in previewVideoRef.current &&
                                  typeof previewVideoRef.current.fastSeek === 'function'
                                ) {
                                  previewVideoRef.current.fastSeek(next);
                                } else {
                                  previewVideoRef.current.currentTime = next;
                                }
                              } catch {}
                            }
                          }}
                          onLoadedMetadata={(e) => {
                            try {
                              const v = e.currentTarget;
                              v.pause();
                              if (pendingPreviewSeekRef.current !== null) {
                                const next = pendingPreviewSeekRef.current;
                                pendingPreviewSeekRef.current = null;
                                if ('fastSeek' in v && typeof v.fastSeek === 'function') {
                                  v.fastSeek(next);
                                } else {
                                  v.currentTime = next;
                                }
                              }
                            } catch {}
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 2,
                          }}
                        />
                      )}
                    </TimelinePreviewVideoWrapper>
                    <TimelinePreviewBadge>
                      {hoverScrub
                        ? `${formatSeconds(hoverScrub.timeSecs)} • ${hoverScrub.percentage.toFixed(0)}%`
                        : '00:00 • 0%'}
                    </TimelinePreviewBadge>
                  </TimelinePreviewCard>
                </TimelinePreviewContainer>
                  <ProgressBarGlobal
                    percentage={localPct}
                    height={6}
                    interactive
                    onSeek={handleProgressBarSeek}
                    onHover={handleProgressBarHover}
                    testID="player-progress-bar"
                  />
                  <TimeRow pointerEvents="none">
                    <TimeText>{formatSeconds(currentTime)}</TimeText>
                    <TimeText>{formatSeconds(duration || player.duration || 0)}</TimeText>
                  </TimeRow>
                </>
              ) : (
                <EpgContainer
                  testID="epg-container"
                  activeOpacity={0.7}
                  onPress={() => {
                    resetHideTimer();
                    setShowEpgModal(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir grade de programação completa"
                >
                  <EpgHeaderRow>
                    <EpgNowBadge>
                      <EpgNowBadgeText>No Ar</EpgNowBadgeText>
                    </EpgNowBadge>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {currentProgram ? (
                        <EpgTimeText>
                          {formatEpgTime(currentProgram.start_timestamp || currentProgram.start)}
                          {currentProgram.stop_timestamp || currentProgram.end
                            ? ` - ${formatEpgTime(currentProgram.stop_timestamp || currentProgram.end)}`
                            : ''}
                        </EpgTimeText>
                      ) : null}
                      <MaterialIcons
                        name="chevron-right"
                        size={16}
                        color="rgba(255, 255, 255, 0.5)"
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                  </EpgHeaderRow>
                  <EpgProgramTitle numberOfLines={1}>
                    {currentProgram ? cleanProgramTitle(currentProgram.title) : 'Programação ao vivo'}
                  </EpgProgramTitle>
                  {currentProgram && (
                    <EpgTrack>
                      <EpgFill widthPercent={epgProgressPercent} />
                    </EpgTrack>
                  )}
                  {nextProgram ? (
                    <EpgNextText numberOfLines={1}>
                      A Seguir: {formatEpgTime(nextProgram.start_timestamp || nextProgram.start)} -{' '}
                      {cleanProgramTitle(nextProgram.title)}
                    </EpgNextText>
                  ) : !currentProgram && !epgLoading ? (
                    <EpgNextText>Programação não disponível para este canal</EpgNextText>
                  ) : null}
                </EpgContainer>
              )}
            </BottomControls>
          </ControlsOverlay>
        )}

        {/* Gaveta Lateral de Canais (Zapping) */}
        {showChannelDrawer && (
          <>
            <DrawerBackdrop
              activeOpacity={1}
              onPress={() => setShowChannelDrawer(false)}
              testID="channel-drawer-backdrop"
            />
            <DrawerContainer testID="channel-drawer">
              <DrawerHeader>
                <DrawerTitle>Canais ({filteredChannels.length})</DrawerTitle>
                <ControlButton
                  onPress={() => setShowChannelDrawer(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar lista de canais"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </ControlButton>
              </DrawerHeader>

              <DrawerSearchInput
                placeholder="Buscar canal..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={channelSearchQuery}
                onChangeText={setChannelSearchQuery}
                clearButtonMode="while-editing"
                autoCorrect={false}
              />

              <FlatList
                {...TV_LIST_PROPS}
                data={filteredChannels}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={15}
                maxToRenderPerBatch={20}
                windowSize={5}
                renderItem={({ item }) => {
                  const isActive = item.id === activeContentId;
                  const isFocused = focusedDrawerChannelId === item.id;
                  return (
                    <DrawerItem
                      isActive={isActive}
                      isFocused={isFocused}
                      focusable={true}
                      onFocus={() => setFocusedDrawerChannelId(item.id)}
                      onBlur={() => setFocusedDrawerChannelId(null)}
                      onPress={() => handleSwitchChannel(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Canal ${item.name}`}
                    >
                      {item.logoUrl ? (
                        <DrawerItemLogo
                          source={{ uri: item.logoUrl }}
                          contentFit="contain"
                          transition={200}
                        />
                      ) : (
                        <DrawerItemLogo
                          source={require('../../../assets/icon.png')}
                          contentFit="contain"
                        />
                      )}
                      <DrawerItemText isActive={isActive} numberOfLines={1}>
                        {item.name}
                      </DrawerItemText>
                      {isActive && (
                        <MaterialIcons name="play-arrow" size={20} color="#E50914" />
                      )}
                    </DrawerItem>
                  );
                }}
              />
            </DrawerContainer>
          </>
        )}

        {/* Modal de Ajustes: Velocidade, Áudio e Legendas */}
        {showSettingsModal && (
          <SettingsModalBackdrop compact={isCompactHeight} testID="settings-modal-backdrop">
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              focusable={false}
              onPress={() => setShowSettingsModal(false)}
            />
            <SettingsModalContent
              compact={isCompactHeight}
              maxHeight={screenHeight - (isCompactHeight ? 16 : 32)}
              testID="settings-modal-content"
            >
              <DrawerHeader style={{ marginBottom: isCompactHeight ? 8 : 16 }}>
                <DrawerTitle>Ajustes de Reprodução</DrawerTitle>
                <ControlButton
                  onPress={() => setShowSettingsModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar ajustes"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </ControlButton>
              </DrawerHeader>

              <ScrollView
                style={{ flexGrow: 0, flexShrink: 1 }}
                showsVerticalScrollIndicator={isCompactHeight}
              >
                {/* Seção Velocidade */}
                <SettingsSection>
                  <SettingsSectionTitle>Velocidade de Reprodução</SettingsSectionTitle>
                  <SpeedRow>
                    {speeds.map((s) => (
                      <SpeedButton
                        key={s}
                        isSelected={playbackSpeed === s}
                        onPress={() => handleSetSpeed(s)}
                        testID={`speed-btn-${s}`}
                      >
                        <SpeedButtonText isSelected={playbackSpeed === s}>
                          {s === 1.0 ? 'Normal (1x)' : `${s}x`}
                        </SpeedButtonText>
                      </SpeedButton>
                    ))}
                  </SpeedRow>
                </SettingsSection>

                {/* Seção Temporizador para Dormir */}
                <SettingsSection>
                  <SettingsSectionTitle>Temporizador para Dormir</SettingsSectionTitle>
                  <SpeedRow>
                    {(['off', 15, 30, 45, 60, 'end'] as SleepTimerOption[]).map((opt) => (
                      <SpeedButton
                        key={opt}
                        isSelected={sleepTimer === opt}
                        onPress={() => handleSetSleepTimer(opt)}
                        testID={`sleep-timer-btn-${opt}`}
                      >
                        <SpeedButtonText isSelected={sleepTimer === opt}>
                          {opt === 'off'
                            ? 'Desativado'
                            : opt === 'end'
                            ? 'Fim do vídeo'
                            : `${opt} min`}
                        </SpeedButtonText>
                      </SpeedButton>
                    ))}
                  </SpeedRow>
                </SettingsSection>

                {/* Seção Proporção de Tela */}
                <SettingsSection>
                  <SettingsSectionTitle>Proporção de Tela</SettingsSectionTitle>
                  <SpeedRow>
                    {[
                      { mode: 'contain', label: 'Ajustar (16:9)' },
                      { mode: 'cover', label: 'Preencher (Zoom)' },
                      { mode: 'fill', label: 'Esticar' },
                    ].map(({ mode, label }) => (
                      <SpeedButton
                        key={mode}
                        isSelected={contentFitMode === mode}
                        onPress={() => setContentFitMode(mode as any)}
                        testID={`content-fit-btn-${mode}`}
                      >
                        <SpeedButtonText isSelected={contentFitMode === mode}>
                          {label}
                        </SpeedButtonText>
                      </SpeedButton>
                    ))}
                  </SpeedRow>
                </SettingsSection>

                {/* Seção Faixa de Áudio */}
                <SettingsSection>
                  <SettingsSectionTitle>Faixa de Áudio</SettingsSectionTitle>
                  {availableAudioTracks.length > 0 ? (
                    availableAudioTracks.map((track, idx) => {
                      const isSelected =
                        selectedAudioTrack?.id === track.id ||
                        (!selectedAudioTrack && idx === 0);
                      return (
                        <TrackItem
                          key={track.id || idx}
                          isSelected={isSelected}
                          onPress={() => handleSelectAudioTrack(track)}
                        >
                          <TrackItemText isSelected={isSelected}>
                            {track.label || track.language || `Áudio ${idx + 1}`}
                          </TrackItemText>
                          {isSelected && (
                            <MaterialIcons name="check" size={18} color="#E50914" />
                          )}
                        </TrackItem>
                      );
                    })
                  ) : (
                    <TrackItem isSelected={true}>
                      <TrackItemText isSelected={true}>Áudio Principal (Padrão)</TrackItemText>
                      <MaterialIcons name="check" size={18} color="#E50914" />
                    </TrackItem>
                  )}
                </SettingsSection>

                {/* Seção Legendas */}
                <SettingsSection style={{ marginBottom: 0 }}>
                  <SettingsSectionTitle>Legendas</SettingsSectionTitle>
                  <TrackItem
                    isSelected={!selectedSubtitle}
                    onPress={() => handleSelectSubtitleTrack(null)}
                  >
                    <TrackItemText isSelected={!selectedSubtitle}>Desativadas</TrackItemText>
                    {!selectedSubtitle && (
                      <MaterialIcons name="check" size={18} color="#E50914" />
                    )}
                  </TrackItem>
                  {availableSubtitles.length > 0 ? (
                    availableSubtitles.map((track, idx) => {
                      const isSelected = selectedSubtitle?.id === track.id;
                      return (
                        <TrackItem
                          key={track.id || idx}
                          isSelected={isSelected}
                          onPress={() => handleSelectSubtitleTrack(track)}
                        >
                          <TrackItemText isSelected={isSelected}>
                            {track.label || track.language || `Legenda ${idx + 1}`}
                          </TrackItemText>
                          {isSelected && (
                            <MaterialIcons name="check" size={18} color="#E50914" />
                          )}
                        </TrackItem>
                      );
                    })
                  ) : (
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 12,
                        marginTop: 4,
                        fontStyle: 'italic',
                      }}
                    >
                      Nenhuma legenda externa ou embutida detectada nesta fonte.
                    </Text>
                  )}
                </SettingsSection>
              </ScrollView>
            </SettingsModalContent>
          </SettingsModalBackdrop>
        )}

        {/* Modal de Grade Completa de Programação (EPG 24h-48h) */}
        {type === 'live' && (
          <EpgModalGlobal
            visible={showEpgModal}
            onClose={() => setShowEpgModal(false)}
            channelName={activeTitle || title}
            channelLogo={activePoster}
            channelNumber={
              liveChannelsList.findIndex(
                (ch) =>
                  String(ch.id) === String(activeContentId) ||
                  String(ch.streamId) === String(activeContentId)
              ) >= 0
                ? liveChannelsList.findIndex(
                    (ch) =>
                      String(ch.id) === String(activeContentId) ||
                      String(ch.streamId) === String(activeContentId)
                  ) + 1
                : undefined
            }
            streamId={String(activeContentId || '')}
            initialEpgList={epgList}
            onPlayArchive={handlePlayArchive}
          />
        )}

        {/* Card de Próximo Episódio estilo Netflix */}
        {showNextEpisodePrompt && !isScreenLocked && renderNextEpisodeCard()}
      </VideoWrapper>
    </Container>
  );
};
