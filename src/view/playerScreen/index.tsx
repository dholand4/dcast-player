import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useAppInsets } from '../../hooks/useAppInsets';
import { PlayerScreenProps } from '../../routes/types';
import { useCast } from '../../hooks/useCast';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { formatSeconds, calculatePercentage } from '../../utils/formatters';
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
  } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const videoSource = useMemo(() => {
    return {
      uri: streamUrl,
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        Accept: '*/*',
      },
    };
  }, [streamUrl]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1.0;
    p.audioMixingMode = 'doNotMix';
    p.keepScreenOnWhilePlaying = true;
    p.bufferOptions = {
      preferredForwardBufferDuration: 20,
      minBufferForPlayback: 2.0,
    };
    if (initialTime > 0) {
      p.currentTime = initialTime;
    }
    p.play();
  });


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

  // Local player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
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

  // Lock orientation to landscape for local playback, restore to portrait on unmount or cast
  useEffect(() => {
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

  useEffect(() => {
    player.timeUpdateEventInterval = 0.5;
    const subTime = player.addListener('timeUpdate', (event) => {
      setCurrentTime(event.currentTime);
      if (player.duration > 0) {
        setDuration(player.duration);
      }
    });
    const subPlaying = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    const subStatus = player.addListener('statusChange', (event) => {
      setIsBuffering(event.status === 'loading');
    });
    return () => {
      subTime.remove();
      subPlaying.remove();
      subStatus.remove();
    };
  }, [player]);

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

  useEffect(() => {
    return () => {
      if (currentTime > 0 && duration > 0) {
        persistCurrentProgress(currentTime, duration);
      }
    };
  }, [currentTime, duration, persistCurrentProgress]);

  // Automatically pause local video and cast to TV when casting session becomes active
  useEffect(() => {
    if (isCasting) {
      player.pause();
      castMedia({
        streamUrl,
        title,
        posterUrl,
        type,
        contentId,
        seriesId,
        seasonNumber,
        episodeNumber,
        initialTime: currentTime,
      }).catch(() => {
        // cast load failed
      });
    }
  }, [isCasting, streamUrl, title, posterUrl, type, contentId, seriesId, seasonNumber, episodeNumber, currentTime, castMedia, player]);

  const handleBack = useCallback(() => {
    const cur = player.currentTime || currentTime;
    const dur = duration || player.duration || 0;
    if (cur > 0 && dur > 0) {
      persistCurrentProgress(cur, dur);
    }
    navigation.goBack();
  }, [currentTime, duration, navigation, persistCurrentProgress, player]);

  const handleLocalSeek = (offsetSeconds: number) => {
    resetHideTimer();
    const current = player.currentTime || currentTime || 0;
    const maxDur = duration || player.duration || 0;
    let nextTime = current + offsetSeconds;
    if (nextTime < 0) nextTime = 0;
    if (maxDur > 0 && nextTime > maxDur) nextTime = maxDur;
    try {
      player.currentTime = nextTime;
      setCurrentTime(nextTime);
    } catch {
      // ignore
    }
  };

  const handleProgressBarSeek = useCallback(
    (percent: number) => {
      resetHideTimer();
      const maxDur = duration || player.duration || 0;
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

  const handleTogglePlay = () => {
    resetHideTimer();
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

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
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture
        />

        {/* Buffering Spinner */}
        {isBuffering && (
          <BufferingWrapper pointerEvents="none" testID="buffering-indicator">
            <ActivityIndicator size="large" color="#E50914" />
          </BufferingWrapper>
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
