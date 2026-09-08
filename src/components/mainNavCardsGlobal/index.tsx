import React from 'react';
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
  return (
    <Container testID={testID}>
      <BigCard
        onPress={onSelectLive}
        activeOpacity={0.8}
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
