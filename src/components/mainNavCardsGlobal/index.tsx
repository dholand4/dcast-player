import React, { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IMainNavCardsGlobalProps } from './types';
import {
  Container,
  BigCard,
  IconBox,
  TextContent,
  CardTitle,
  CardSubtitle,
  ArrowText,
} from './style';

export const MainNavCardsGlobal: React.FC<IMainNavCardsGlobalProps> = ({
  onSelectLive,
  onSelectMovies,
  onSelectSeries,
  testID,
}) => {
  const { width } = useWindowDimensions();
  const isRow = Platform.isTV || width >= 700;
  const [focusedCard, setFocusedCard] = useState<string | null>(null);

  return (
    <Container testID={testID} isRow={isRow}>
      <BigCard
        onPress={onSelectLive}
        activeOpacity={0.8}
        isRow={isRow}
        isFocused={focusedCard === 'live'}
        focusable={true}
        onFocus={() => setFocusedCard('live')}
        onBlur={() => setFocusedCard(null)}
        accessibilityRole="button"
        accessibilityLabel="Canais Ao Vivo"
      >
        <IconBox accentColor="rgba(229, 9, 20, 0.15)">
          <MaterialIcons name="live-tv" size={28} color="#E50914" />
        </IconBox>
        <TextContent>
          <CardTitle>Canais Ao Vivo</CardTitle>
          <CardSubtitle>Transmissão em tempo real</CardSubtitle>
        </TextContent>
        <ArrowText>›</ArrowText>
      </BigCard>

      <BigCard
        onPress={onSelectMovies}
        activeOpacity={0.8}
        isRow={isRow}
        isFocused={focusedCard === 'movies'}
        focusable={true}
        onFocus={() => setFocusedCard('movies')}
        onBlur={() => setFocusedCard(null)}
        accessibilityRole="button"
        accessibilityLabel="Filmes"
      >
        <IconBox accentColor="rgba(3, 218, 198, 0.15)">
          <MaterialIcons name="movie" size={28} color="#03DAC6" />
        </IconBox>
        <TextContent>
          <CardTitle>Filmes</CardTitle>
          <CardSubtitle>Catálogo completo de filmes</CardSubtitle>
        </TextContent>
        <ArrowText>›</ArrowText>
      </BigCard>

      <BigCard
        onPress={onSelectSeries}
        activeOpacity={0.8}
        isRow={isRow}
        isFocused={focusedCard === 'series'}
        focusable={true}
        onFocus={() => setFocusedCard('series')}
        onBlur={() => setFocusedCard(null)}
        accessibilityRole="button"
        accessibilityLabel="Séries"
      >
        <IconBox accentColor="rgba(255, 179, 0, 0.15)">
          <MaterialIcons name="video-library" size={28} color="#FFB300" />
        </IconBox>
        <TextContent>
          <CardTitle>Séries</CardTitle>
          <CardSubtitle>Temporadas completas e episódios</CardSubtitle>
        </TextContent>
        <ArrowText>›</ArrowText>
      </BigCard>
    </Container>
  );
};
