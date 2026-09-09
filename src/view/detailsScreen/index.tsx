import React, { useState, useEffect, useMemo } from 'react';
import { Platform, Linking, Alert, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppInsets } from '../../hooks/useAppInsets';
import { DetailsScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useXtream } from '../../hooks/useXtream';
import { useFavorites } from '../../hooks/useFavorites';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { xtreamService } from '../../services/xtreamService';
import { prefetchService } from '../../services/prefetchService';
import { ButtonGlobal } from '../../components/buttonGlobal';
import { BadgeGlobal } from '../../components/badgeGlobal';
import { CastButtonGlobal } from '../../components/castButtonGlobal';
import { ProgressBarGlobal } from '../../components/progressBarGlobal';
import { LoadingGlobal } from '../../components/loadingGlobal';
import { IXtreamEpisode } from '../../@types/xtream';
import {
  cleanSeriesTitle,
  cleanEpisodeDisplayTitle,
  formatEpisodeTitle,
} from '../../utils/formatters';
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
  const { id, type, title, posterUrl, containerExtension } = route.params;
  const { account } = useAuth();
  const { seriesInfo, isLoading, fetchSeriesInfo } = useXtream(account);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getProgress, getAllWatchProgress, saveProgress } = useWatchHistory();

  const [selectedSeason, setSelectedSeason] = useState<string>('1');
  const [movieInfo, setMovieInfo] = useState<{
    youtube_trailer?: string;
    plot?: string;
    rating?: string;
    genre?: string;
    director?: string;
    cast?: string;
    duration_secs?: number;
  } | null>(null);

  useEffect(() => {
    if (type === 'series') {
      fetchSeriesInfo(id);
    } else if (type === 'movie' && account) {
      let isMounted = true;
      xtreamService
        .getVodInfo(account, id)
        .then((data) => {
          if (isMounted && data?.info) {
            setMovieInfo(data.info);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }
  }, [id, type, account, fetchSeriesInfo]);

  // Smart Pre-fetch: pré-carrega os primeiros megabytes da mídia em segundo plano
  useEffect(() => {
    if (!account) return;
    if (type === 'movie') {
      const url = xtreamService.buildVodStreamUrl(account, id, containerExtension || 'mp4');
      prefetchService.prefetchVod(url);
    } else if (type === 'series' && seriesInfo?.episodes) {
      const eps = seriesInfo.episodes[selectedSeason];
      if (eps && eps.length > 0) {
        const firstEp = eps[0];
        const epUrl = xtreamService.buildSeriesStreamUrl(
          account,
          firstEp.id,
          firstEp.container_extension || 'mp4'
        );
        prefetchService.prefetchVod(epUrl);
      }
    }
  }, [type, account, id, containerExtension, seriesInfo, selectedSeason]);

  const rawTrailer =
    type === 'series'
      ? seriesInfo?.info?.youtube_trailer
      : movieInfo?.youtube_trailer;

  const trailerUrl = useMemo(() => {
    if (!rawTrailer || typeof rawTrailer !== 'string') return null;
    const trimmed = rawTrailer.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://www.youtube.com/watch?v=${encodeURIComponent(trimmed)}`;
  }, [rawTrailer]);

  const handleOpenTrailer = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Trailer', 'Não foi possível abrir o trailer no momento.');
    }
  };

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

  const baseSeriesTitle = useMemo(() => {
    if (type !== 'series') return title;
    return seriesInfo?.info?.name || cleanSeriesTitle(title);
  }, [type, title, seriesInfo]);

  const allSeriesEpisodes = useMemo(() => {
    if (type !== 'series' || !seriesInfo?.episodes || !account) return [];
    const epsMap = seriesInfo.episodes;
    return availableSeasons.flatMap((seasonKey) => {
      const eps = epsMap[seasonKey] || [];
      return eps.map((ep) => ({
        id: String(ep.id),
        title: formatEpisodeTitle(baseSeriesTitle, seasonKey, ep.episode_num, ep.title),
        streamUrl: xtreamService.buildSeriesStreamUrl(
          account,
          ep.id,
          ep.container_extension || 'mp4'
        ),
        posterUrl: ep.info?.movie_image || posterUrl,
        seasonNumber: Number(seasonKey),
        episodeNumber: Number(ep.episode_num),
      }));
    });
  }, [type, seriesInfo, availableSeasons, account, baseSeriesTitle, posterUrl]);

  const handlePlayMovie = () => {
    if (!account) return;
    const streamUrl = xtreamService.buildVodStreamUrl(account, id, containerExtension || 'mp4');
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
    const epTitle = formatEpisodeTitle(baseSeriesTitle, season, episode.episode_num, episode.title);
    const epProgress =
      getProgress(String(episode.id)) ||
      (latestSeriesProgress &&
      (String(latestSeriesProgress.id) === String(episode.id) ||
        (Number(latestSeriesProgress.seasonNumber) === Number(season) &&
          Number(latestSeriesProgress.episodeNumber) === Number(episode.episode_num)))
        ? latestSeriesProgress
        : null);

    // Salvar progresso imediatamente para marcar o episódio como aberto/assistido
    saveProgress({
      id: String(episode.id),
      seriesId: id,
      title: epTitle,
      posterUrl: episode.info?.movie_image || posterUrl || '',
      type: 'series',
      seasonNumber: Number(season),
      episodeNumber: Number(episode.episode_num),
      currentTime: epProgress?.currentTime || 1,
      duration: epProgress?.duration || 0,
      percentage: epProgress?.percentage || 1,
      updatedAt: Date.now(),
      streamUrl,
    });

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
      seriesEpisodes: allSeriesEpisodes,
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

      const resumeTitle =
        cleanEpisodeDisplayTitle(latestSeriesProgress.title) ||
        formatEpisodeTitle(
          baseSeriesTitle,
          latestSeriesProgress.seasonNumber,
          latestSeriesProgress.episodeNumber
        );

      navigation.navigate('PlayerScreen', {
        streamUrl,
        title: resumeTitle,
        posterUrl: latestSeriesProgress.posterUrl || posterUrl,
        type: 'series',
        contentId: latestSeriesProgress.id,
        seriesId: id,
        seasonNumber: latestSeriesProgress.seasonNumber || 1,
        episodeNumber: latestSeriesProgress.episodeNumber || 1,
        initialTime: latestSeriesProgress.currentTime || 0,
        seriesEpisodes: allSeriesEpisodes,
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
      name: baseSeriesTitle,
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
        <TitleText>{baseSeriesTitle}</TitleText>

        <MetaRow>
          {type === 'series' && seriesInfo?.info?.rating ? (
            <BadgeGlobal
              text={`★ ${seriesInfo.info.rating}`}
              variant="rating"
            />
          ) : null}
          {type === 'movie' && movieInfo?.rating ? (
            <BadgeGlobal
              text={`★ ${movieInfo.rating}`}
              variant="rating"
            />
          ) : null}
          <BadgeGlobal text="HD" variant="hd" />
          {type === 'series' && (
            <MetaText>{availableSeasons.length} Temporadas</MetaText>
          )}
          {type === 'movie' && (
            <MetaText>
              {movieInfo?.duration_secs
                ? `${Math.floor(movieInfo.duration_secs / 60)} min`
                : 'Filme Completo'}
            </MetaText>
          )}
          {movieInfo?.genre ? <MetaText>• {movieInfo.genre}</MetaText> : null}
        </MetaRow>

        <ButtonRow style={{ flexWrap: 'wrap' }}>
          {type === 'movie' && (
            <ButtonFlex style={{ minWidth: 160, flex: 2 }}>
              <ButtonGlobal
                label={watchProgress ? 'Continuar Assistindo' : 'Assistir'}
                onPress={handlePlayMovie}
                size="lg"
              />
            </ButtonFlex>
          )}
          {type === 'series' && (
            <ButtonFlex style={{ minWidth: 160, flex: 2 }}>
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
          {trailerUrl ? (
            <ButtonFlex style={{ minWidth: 120, flex: 1 }}>
              <ButtonGlobal
                label="Ver Trailer"
                variant="ghost"
                icon={<MaterialIcons name="ondemand-video" size={20} color="#FFFFFF" />}
                onPress={() => handleOpenTrailer(trailerUrl)}
                size="lg"
                testID="details-trailer-button"
              />
            </ButtonFlex>
          ) : null}
          <ButtonFlex style={{ minWidth: 120, flex: 1 }}>
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
            : movieInfo?.plot || 'Prepare sua pipoca e transmita em alta definição para a sua TV.'}
        </PlotText>

        {movieInfo?.director ? (
          <MetaText style={{ marginBottom: 6 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Direção: </Text>
            {movieInfo.director}
          </MetaText>
        ) : null}

        {movieInfo?.cast ? (
          <MetaText style={{ marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Elenco: </Text>
            {movieInfo.cast}
          </MetaText>
        ) : null}

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
                  const isWatched = Boolean(
                    epProgress &&
                    (epProgress.currentTime > 0 ||
                      epProgress.percentage > 0 ||
                      epProgress.updatedAt > 0)
                  );
                  return (
                    <EpisodeItem
                      key={`ep-${ep.id}`}
                      onPress={() => handlePlayEpisode(ep)}
                      activeOpacity={0.7}
                      isWatched={isWatched}
                      testID={`episode-item-${ep.id}`}
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
