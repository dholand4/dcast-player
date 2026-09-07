import React, { useState, useEffect, useMemo } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppInsets } from '../../hooks/useAppInsets';
import { DetailsScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useXtream } from '../../hooks/useXtream';
import { useFavorites } from '../../hooks/useFavorites';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { xtreamService } from '../../services/xtreamService';
import { ButtonGlobal } from '../../components/buttonGlobal';
import { BadgeGlobal } from '../../components/badgeGlobal';
import { CastButtonGlobal } from '../../components/castButtonGlobal';
import { ProgressBarGlobal } from '../../components/progressBarGlobal';
import { LoadingGlobal } from '../../components/loadingGlobal';
import { IXtreamEpisode } from '../../@types/xtream';
import {
  Container,
  HeroContainer,
  HeroBackdrop,
  GradientOverlay,
  TopBar,
  CircleButton,
  CircleButtonText,
  ContentPadding,
  TitleText,
  MetaRow,
  MetaText,
  ButtonRow,
  ButtonFlex,
  PlotText,
  SectionTitle,
  SeasonScroll,
  SeasonPill,
  SeasonPillText,
  EpisodeItem,
  EpisodeThumbWrapper,
  EpisodeThumb,
  EpisodeInfo,
  EpisodeTitle,
  EpisodeSub,
} from './style';

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const { id, type, title, posterUrl } = route.params;
  const { account } = useAuth();
  const { seriesInfo, isLoading, fetchSeriesInfo } = useXtream(account);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getProgress, getAllWatchProgress } = useWatchHistory();

  const [selectedSeason, setSelectedSeason] = useState<string>('1');

  useEffect(() => {
    if (type === 'series') {
      fetchSeriesInfo(id);
    }
  }, [id, type, fetchSeriesInfo]);

  const isFav = isFavorite(id);
  const watchProgress = getProgress(id);

  const availableSeasons = useMemo(() => {
    if (!seriesInfo?.episodes) return [];
    return Object.keys(seriesInfo.episodes).sort((a, b) => Number(a) - Number(b));
  }, [seriesInfo]);

  useEffect(() => {
    if (availableSeasons.length > 0 && !availableSeasons.includes(selectedSeason)) {
      setSelectedSeason(availableSeasons[0]);
    }
  }, [availableSeasons, selectedSeason]);

  const currentEpisodes = useMemo(() => {
    if (!seriesInfo?.episodes || !selectedSeason) return [];
    return seriesInfo.episodes[selectedSeason] || [];
  }, [seriesInfo, selectedSeason]);

  const latestSeriesProgress = useMemo(() => {
    if (type !== 'series') return null;
    const all = getAllWatchProgress();
    return all.find((item) => item.seriesId === id || item.id === id) || null;
  }, [type, id, getAllWatchProgress]);

  const handlePlayMovie = () => {
    if (!account) return;
    const streamUrl = xtreamService.buildVodStreamUrl(account, id);
    navigation.navigate('PlayerScreen', {
      streamUrl,
      title,
      posterUrl,
      type: 'movie',
      contentId: id,
      initialTime: watchProgress?.currentTime || 0,
    });
  };

  const handlePlayEpisode = (episode: IXtreamEpisode, seasonNum?: string | number) => {
    if (!account) return;
    const streamUrl = xtreamService.buildSeriesStreamUrl(
      account,
      episode.id,
      episode.container_extension || 'mp4'
    );
    const season = seasonNum ? String(seasonNum) : selectedSeason;
    const epTitle = `${title} - T${season}E${episode.episode_num}: ${episode.title}`;
    const epProgress = getProgress(String(episode.id));

    navigation.navigate('PlayerScreen', {
      streamUrl,
      title: epTitle,
      posterUrl: episode.info?.movie_image || posterUrl,
      type: 'series',
      contentId: String(episode.id),
      seriesId: id,
      seasonNumber: Number(season),
      episodeNumber: Number(episode.episode_num),
      initialTime: epProgress?.currentTime || 0,
    });
  };

  const handlePlaySeriesResumeOrStart = () => {
    if (!account) return;

    if (latestSeriesProgress) {
      const seasonKey = String(latestSeriesProgress.seasonNumber || '1');
      const epNum = latestSeriesProgress.episodeNumber || 1;
      const episode = seriesInfo?.episodes?.[seasonKey]?.find(
        (e) => Number(e.episode_num) === epNum || String(e.id) === latestSeriesProgress.id
      );

      if (episode) {
        handlePlayEpisode(episode, seasonKey);
        return;
      }

      const streamUrl =
        latestSeriesProgress.streamUrl ||
        xtreamService.buildSeriesStreamUrl(account, Number(latestSeriesProgress.id), 'mp4');

      navigation.navigate('PlayerScreen', {
        streamUrl,
        title: latestSeriesProgress.title || title,
        posterUrl: latestSeriesProgress.posterUrl || posterUrl,
        type: 'series',
        contentId: latestSeriesProgress.id,
        seriesId: id,
        seasonNumber: latestSeriesProgress.seasonNumber || 1,
        episodeNumber: latestSeriesProgress.episodeNumber || 1,
        initialTime: latestSeriesProgress.currentTime || 0,
      });
      return;
    }

    const firstSeason = availableSeasons[0] || '1';
    const firstEpisode = seriesInfo?.episodes?.[firstSeason]?.[0];
    if (firstEpisode) {
      handlePlayEpisode(firstEpisode, firstSeason);
    }
  };

  const handleToggleFav = () => {
    toggleFavorite({
      id,
      name: title,
      posterUrl: posterUrl || '',
      type,
      categoryId: '',
      addedAt: Date.now(),
    });
  };

  const backdropUri =
    type === 'series' && seriesInfo?.info?.backdrop_path?.[0]
      ? seriesInfo.info.backdrop_path[0]
      : posterUrl;

  const insets = useAppInsets();

  return (
    <Container testID="details-screen">
      <HeroContainer>
        {backdropUri && (
          <HeroBackdrop source={{ uri: backdropUri }} contentFit="cover" />
        )}
        <GradientOverlay
          colors={['transparent', 'rgba(18, 18, 18, 0.8)', '#121212']}
        />
        <TopBar insetTop={insets.top}>
          <CircleButton
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            testID="details-back-button"
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </CircleButton>
          <CastButtonGlobal />
        </TopBar>
      </HeroContainer>

      <ContentPadding>
        <TitleText>{title}</TitleText>

        <MetaRow>
          {type === 'series' && seriesInfo?.info?.rating && (
            <BadgeGlobal
              text={`★ ${seriesInfo.info.rating}`}
              variant="rating"
            />
          )}
          <BadgeGlobal text="HD" variant="hd" />
          {type === 'series' && (
            <MetaText>{availableSeasons.length} Temporadas</MetaText>
          )}
          {type === 'movie' && (
            <MetaText>Filme Completo</MetaText>
          )}
        </MetaRow>

        <ButtonRow>
          {type === 'movie' && (
            <ButtonFlex>
              <ButtonGlobal
                label={watchProgress ? 'Continuar Assistindo' : 'Assistir'}
                onPress={handlePlayMovie}
                size="lg"
              />
            </ButtonFlex>
          )}
          {type === 'series' && (
            <ButtonFlex>
              <ButtonGlobal
                label={
                  latestSeriesProgress
                    ? `Continuar T${latestSeriesProgress.seasonNumber || 1}E${latestSeriesProgress.episodeNumber || 1}`
                    : 'Começar a Assistir'
                }
                onPress={handlePlaySeriesResumeOrStart}
                size="lg"
                disabled={!latestSeriesProgress && (!seriesInfo?.episodes || availableSeasons.length === 0)}
              />
            </ButtonFlex>
          )}
          <ButtonFlex>
            <ButtonGlobal
              label={isFav ? 'Favoritado ❤️' : 'Favoritar'}
              variant={isFav ? 'secondary' : 'ghost'}
              onPress={handleToggleFav}
              size="lg"
            />
          </ButtonFlex>
        </ButtonRow>

        {/* Sinopse */}
        <PlotText>
          {type === 'series'
            ? seriesInfo?.info?.plot || 'Carregando sinopse da série...'
            : 'Prepare sua pipoca e transmita em alta definição para a sua TV.'}
        </PlotText>

        {/* Seção de Séries: Temporadas e Episódios */}
        {type === 'series' && (
          <>
            <SectionTitle>Temporadas & Episódios</SectionTitle>
            {isLoading && availableSeasons.length === 0 ? (
              <LoadingGlobal message="Carregando episódios..." />
            ) : (
              <>
                <SeasonScroll>
                  {availableSeasons.map((season) => (
                    <SeasonPill
                      key={`season-${season}`}
                      isSelected={selectedSeason === season}
                      onPress={() => setSelectedSeason(season)}
                    >
                      <SeasonPillText isSelected={selectedSeason === season}>
                        Temporada {season}
                      </SeasonPillText>
                    </SeasonPill>
                  ))}
                </SeasonScroll>

                {currentEpisodes.map((ep) => {
                  const epProgress = getProgress(String(ep.id));
                  return (
                    <EpisodeItem
                      key={`ep-${ep.id}`}
                      onPress={() => handlePlayEpisode(ep)}
                      activeOpacity={0.7}
                    >
                      <EpisodeThumbWrapper>
                        <EpisodeThumb
                          source={{ uri: ep.info?.movie_image || posterUrl }}
                          contentFit="cover"
                        />
                        {epProgress && epProgress.percentage > 0 && (
                          <ProgressBarGlobal
                            percentage={epProgress.percentage}
                            height={3}
                          />
                        )}
                      </EpisodeThumbWrapper>
                      <EpisodeInfo>
                        <EpisodeTitle>
                          {ep.episode_num}. {ep.title}
                        </EpisodeTitle>
                        <EpisodeSub>
                          {ep.info?.duration || 'Duração padrão'}
                        </EpisodeSub>
                      </EpisodeInfo>
                    </EpisodeItem>
                  );
                })}
              </>
            )}
          </>
        )}
      </ContentPadding>
    </Container>
  );
};
