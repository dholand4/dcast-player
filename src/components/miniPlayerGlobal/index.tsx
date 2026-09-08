import React, { useState, useEffect, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useCast } from '../../hooks/useCast';
import { useAppInsets } from '../../hooks/useAppInsets';
import { navigationRef } from '../../routes/navigationRef';
import { IMiniPlayerGlobalProps } from './types';
import {
  Container,
  ProgressBarWrapper,
  ProgressBarFill,
  InnerRow,
  PosterThumbnail,
  InfoContainer,
  TitleText,
  StatusRow,
  StatusText,
  ActionButtons,
  IconButton,
} from './style';

export const MiniPlayerGlobal: React.FC<IMiniPlayerGlobalProps> = ({ testID }) => {
  const theme = useTheme();
  const insets = useAppInsets();
  const [currentRouteName, setCurrentRouteName] = useState<string | null>(null);

  const {
    isCasting,
    isPlaying,
    streamPosition,
    streamDuration,
    currentMedia,
    play,
    pause,
    stopCast,
  } = useCast();

  useEffect(() => {
    const updateRoute = () => {
      try {
        if (navigationRef.isReady()) {
          const route = navigationRef.getCurrentRoute();
          setCurrentRouteName(route?.name || null);
        }
      } catch {
        // ignore
      }
    };

    updateRoute();
    const unsubscribe = navigationRef.addListener?.('state', updateRoute);
    return () => {
      unsubscribe?.();
    };
  }, []);

  const progressPercent = useMemo(() => {
    if (!streamDuration || streamDuration <= 0) return 0;
    return Math.min(100, (streamPosition / streamDuration) * 100);
  }, [streamPosition, streamDuration]);

  // Se não estiver transmitindo, não houver mídia ativa ou já estiver na tela do Player, ocultar
  if (!isCasting || !currentMedia || currentRouteName === 'PlayerScreen') {
    return null;
  }

  const handleOpenPlayer = () => {
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate('PlayerScreen', {
          streamUrl: currentMedia.streamUrl,
          title: currentMedia.title,
          posterUrl: currentMedia.posterUrl,
          type: currentMedia.type,
          contentId: currentMedia.contentId,
          seriesId: currentMedia.seriesId,
          seasonNumber: currentMedia.seasonNumber,
          episodeNumber: currentMedia.episodeNumber,
          initialTime: Math.floor(streamPosition),
        });
      }
    } catch {
      // ignore
    }
  };

  const handleTogglePlayPause = (e: any) => {
    e?.stopPropagation?.();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStopCast = (e: any) => {
    e?.stopPropagation?.();
    stopCast();
  };

  return (
    <Container
      insetBottom={insets.bottom}
      testID={testID || 'mini-player-global'}
    >
      {/* Barra de Progresso Superior */}
      {streamDuration > 0 && (
        <ProgressBarWrapper>
          <ProgressBarFill progressPercent={progressPercent} />
        </ProgressBarWrapper>
      )}

      <InnerRow
        onPress={handleOpenPlayer}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Reproduzindo ${currentMedia.title}. Toque para abrir controles em tela cheia.`}
      >
        {/* Pôster Thumbnail */}
        {currentMedia.posterUrl ? (
          <PosterThumbnail
            source={{ uri: currentMedia.posterUrl }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <PosterThumbnail
            source={require('../../../assets/icon.png')}
            contentFit="contain"
          />
        )}

        {/* Informações da Mídia */}
        <InfoContainer>
          <TitleText numberOfLines={1}>{currentMedia.title}</TitleText>
          <StatusRow>
            <MaterialIcons name="cast-connected" size={13} color="#46D369" />
            <StatusText numberOfLines={1}>
              {isPlaying ? 'Transmitindo na TV' : 'Na TV • Pausado'}
            </StatusText>
          </StatusRow>
        </InfoContainer>

        {/* Botões de Ação Rápida */}
        <ActionButtons>
          <IconButton
            onPress={handleTogglePlayPause}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pausar reprodução' : 'Continuar reprodução'}
            testID="mini-player-play-pause-btn"
          >
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={28}
              color={theme.colors.text}
            />
          </IconButton>

          <IconButton
            onPress={handleStopCast}
            accessibilityRole="button"
            accessibilityLabel="Desconectar da TV"
            testID="mini-player-stop-btn"
          >
            <MaterialIcons name="close" size={22} color={theme.colors.textSecondary} />
          </IconButton>
        </ActionButtons>
      </InnerRow>
    </Container>
  );
};
