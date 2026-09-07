import React from 'react';
import { IMainNavCardsGlobalProps } from './types';
import {
  Container,
  BigCard,
  IconBox,
  IconText,
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
          <IconText>🔴</IconText>
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
          <IconText>🔵</IconText>
        </IconBox>
        <TextContent>
          <CardTitle>Filmes (VOD)</CardTitle>
          <CardSubtitle>Catálogo completo de longas-metragens</CardSubtitle>
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
          <IconText>🟡</IconText>
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
