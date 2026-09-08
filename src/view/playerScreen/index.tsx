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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAppInsets } from '../../hooks/useAppInsets';
import { PlayerScreenProps, LiveChannelItem } from '../../routes/types';
import { IEpgListing } from '../../@types/xtream';
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
    liveChannels,
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

  // Informações ativas de canais / conteúdos
  const [activeContentId, setActiveContentId] = useState(contentId);
  const [activeTitle, setActiveTitle] = useState(title);
  const [activePoster, setActivePoster] = useState(posterUrl);
  const [liveChannelsList, setLiveChannelsList] = useState<LiveChannelItem[]>(liveChannels || []);

  useEffect(() => {
    if (liveChannels && liveChannels.length > 0) {
      setLiveChannelsList(liveChannels);
    }
  }, [liveChannels]);

  useEffect(() => {
    setActiveTitle(title);
    setActivePoster(posterUrl);
    setActiveContentId(contentId);
  }, [title, posterUrl, contentId]);

  // EPG (Guia de Programação) para TV ao Vivo
  const [epgList, setEpgList] = useState<IEpgListing[]>([]);
  const [epgLoading, setEpgLoading] = useState(false);

  // Gaveta lateral de canais (Zapping)
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');

  // Modal de Ajustes (Velocidade, Áudio e Legendas)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<any>(null);
  const [availableSubtitles, setAvailableSubtitles] = useState<any[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<any>(null);

  const videoSource = useMemo(() => {
    const isHls = currentStreamUrl.includes('.m3u8');
    return {
      uri: currentStreamUrl,
      contentType: (isHls ? 'hls' : 'auto') as any,
      useCaching: Platform.OS !== 'web',
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        Accept: '*/*',
        Connection: 'keep-alive',
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
    currentMedia: activeCastMedia,
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
        preferredForwardBufferDuration: 30,
        minBufferForPlayback: 1.0,
        prioritizeTimeOverSizeThreshold: true,
        waitsToMinimizeStalling: true,
        maxBufferBytes: 30 * 1024 * 1024,
      };
    } else {
      p.bufferOptions = {
        preferredForwardBufferDuration: 60,
        minBufferForPlayback: 1.0,
        prioritizeTimeOverSizeThreshold: true,
        waitsToMinimizeStalling: true,
        maxBufferBytes: 60 * 1024 * 1024,
      };
    }
    if (initialTime > 0) {
      p.currentTime = initialTime;
    }
    // Autoplay localmente apenas se NÃO estiver transmitindo para a TV
    if (!isCastingRef.current) {
      try {
        p.play();
      } catch {
        // ignore
      }
    } else {
      p.pause();
    }
  });

  // Local player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
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
    if (!channelSearchQuery.trim()) return liveChannelsList;
    const q = channelSearchQuery.toLowerCase();
    return liveChannelsList.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [liveChannelsList, channelSearchQuery]);

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

      try {
        if (typeof (player as any).replace === 'function') {
          player.replace({
            uri: newUrl,
            contentType: (newUrl.includes('.m3u8') ? 'hls' : 'auto') as any,
            headers: {
              'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
              Accept: '*/*',
            },
          });
        }
        player.play();
      } catch (err) {
        console.warn('[Player] Erro ao trocar de canal:', err);
      }
    },
    [activeContentId, player]
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
      if (typeof (player as any).startPictureInPicture === 'function') {
        (player as any).startPictureInPicture();
      } else {
        Alert.alert(
          'Picture-in-Picture',
          'No celular, o modo PiP é ativado automaticamente ao minimizar o app durante a reprodução.'
        );
      }
    } catch {
      Alert.alert(
        'Picture-in-Picture',
        'No celular, o modo PiP é ativado automaticamente ao minimizar o app durante a reprodução.'
      );
    }
  }, [resetHideTimer, player]);

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

  useEffect(() => {
    if (!showNextEpisodePrompt) return;

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
  }, [showNextEpisodePrompt]);

  useEffect(() => {
    setShowNextEpisodePrompt(false);
    showNextEpisodePromptRef.current = false;
    setNextEpisodeDismissed(false);
    nextEpisodeDismissedRef.current = false;
  }, [contentId]);

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
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) {
        setIsBuffering(false);
      }
    });
    const subStatus = player.addListener('statusChange', (event) => {
      setIsBuffering(event.status === 'loading' && !player.playing);
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
        // Iniciar reprodução automaticamente assim que o buffer estiver preenchido
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
        }
      }
    });
    const subEnd = (player as any).addListener?.('playToEnd', () => {
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

      // Se a mídia já estiver ativa e rodando no Chromecast (ex: reabrindo pelo MiniPlayer),
      // NÃO recarrega o filme nem reinicia o buffer na TV!
      const isAlreadyPlayingOnCast =
        activeCastMedia &&
        (activeCastMedia.contentId === contentId ||
          activeCastMedia.streamUrl === streamUrl ||
          (activeCastMedia.title === title && activeCastMedia.type === type));

      if (isAlreadyPlayingOnCast) {
        return;
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
    activeCastMedia,
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
        {!isScreenLocked && (
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
              <PlayerTitle>{activeTitle}</PlayerTitle>
              <TopRightActions pointerEvents="box-none">
                {sleepTimer !== 'off' && (
                  <TouchableOpacity
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
                  </TouchableOpacity>
                )}

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
              {type !== 'live' ? (
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
              ) : (
                <EpgContainer testID="epg-container">
                  <EpgHeaderRow>
                    <EpgNowBadge>
                      <EpgNowBadgeText>No Ar</EpgNowBadgeText>
                    </EpgNowBadge>
                    {currentProgram ? (
                      <EpgTimeText>
                        {formatEpgTime(currentProgram.start_timestamp || currentProgram.start)}
                        {currentProgram.stop_timestamp || currentProgram.end
                          ? ` - ${formatEpgTime(currentProgram.stop_timestamp || currentProgram.end)}`
                          : ''}
                      </EpgTimeText>
                    ) : null}
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
                data={filteredChannels}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={15}
                maxToRenderPerBatch={20}
                windowSize={5}
                renderItem={({ item }) => {
                  const isActive = item.id === activeContentId;
                  return (
                    <DrawerItem
                      isActive={isActive}
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
          <SettingsModalBackdrop testID="settings-modal-backdrop">
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowSettingsModal(false)}
            />
            <SettingsModalContent>
              <DrawerHeader style={{ marginBottom: 16 }}>
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

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
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

        {/* Card de Próximo Episódio estilo Netflix */}
        {showNextEpisodePrompt && !isScreenLocked && nextEpisode && (
          <NextEpisodeContainer testID="next-episode-card">
            <NextEpisodeHeader>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="skip-next" size={16} color="#E50914" style={{ marginRight: 4 }} />
                <NextEpisodeCountdown>Próximo em {nextEpisodeCountdown}s</NextEpisodeCountdown>
              </View>
              <TouchableOpacity
                onPress={handleCancelNextEpisode}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso de próximo episódio"
              >
                <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
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
        )}
      </VideoWrapper>
    </Container>
  );
};
