import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAppInsets } from '../../hooks/useAppInsets';
import { useAuth } from '../../hooks/useAuth';
import { SearchScreenProps } from '../../routes/types';
import { xtreamService } from '../../services/xtreamService';
import { storageService } from '../../services/storageService';
import {
  Container,
  SearchHeader,
  IconButton,
  SearchInputWrapper,
  SearchInput,
  TabsContainer,
  TabButton,
  TabButtonText,
  ResultsListWrapper,
  ResultCard,
  ResultPosterWrapper,
  ResultPoster,
  TypeBadge,
  TypeBadgeText,
  RatingBadge,
  RatingText,
  ResultInfo,
  ResultTitle,
  ResultMeta,
  EmptyContainer,
  EmptyTitle,
  EmptySubtitle,
  LoadingWrapper,
} from './style';

type SearchFilterType = 'all' | 'live' | 'movie' | 'series';

interface UnifiedSearchResult {
  id: string;
  name: string;
  type: 'live' | 'movie' | 'series';
  posterUrl?: string;
  rating?: string;
  categoryName?: string;
  containerExtension?: string;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const insets = useAppInsets();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { account } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<SearchFilterType>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Armazena todos os conteúdos do provedor
  const [allData, setAllData] = useState<UnifiedSearchResult[]>([]);
  const hasLoadedRef = useRef(false);

  // Debounce query de busca (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Carrega em background os itens de Canais, Filmes e Séries
  const loadUnifiedCatalog = useCallback(async () => {
    if (!account || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setIsLoading(true);

    try {
      const accKey = `${account.serverUrl}_${account.username}`;

      // 1. Tenta recuperar primeiro do cache local
      const cachedLive = storageService.getCachedStreams<any[]>(`${accKey}_streams_live_all`);
      const cachedVod = storageService.getCachedStreams<any[]>(`${accKey}_streams_movie_all`);
      const cachedSeries = storageService.getCachedStreams<any[]>(`${accKey}_streams_series_all`);

      let liveList = cachedLive || [];
      let vodList = cachedVod || [];
      let seriesList = cachedSeries || [];

      // 2. Se algum não estiver no cache, carrega em paralelo
      const promises: Promise<any>[] = [];

      if (!liveList.length) {
        promises.push(
          xtreamService.getLiveStreams(account).then((res) => {
            liveList = res || [];
            storageService.saveCachedStreams(`${accKey}_streams_live_all`, liveList);
          }).catch(() => {})
        );
      }
      if (!vodList.length) {
        promises.push(
          xtreamService.getVodStreams(account).then((res) => {
            vodList = res || [];
            storageService.saveCachedStreams(`${accKey}_streams_movie_all`, vodList);
          }).catch(() => {})
        );
      }
      if (!seriesList.length) {
        promises.push(
          xtreamService.getSeries(account).then((res) => {
            seriesList = res || [];
            storageService.saveCachedStreams(`${accKey}_streams_series_all`, seriesList);
          }).catch(() => {})
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      // 3. Normaliza e unifica
      const unified: UnifiedSearchResult[] = [
        ...liveList.map((item) => ({
          id: String(item.stream_id || item.id),
          name: item.name || '',
          type: 'live' as const,
          posterUrl: item.stream_icon,
        })),
        ...vodList.map((item) => ({
          id: String(item.stream_id || item.id),
          name: item.name || '',
          type: 'movie' as const,
          posterUrl: item.stream_icon,
          rating: item.rating,
          containerExtension: item.container_extension || 'mp4',
        })),
        ...seriesList.map((item) => ({
          id: String(item.series_id || item.id),
          name: item.name || '',
          type: 'series' as const,
          posterUrl: item.cover,
          rating: item.rating,
        })),
      ];

      setAllData(unified);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadUnifiedCatalog();
  }, [loadUnifiedCatalog]);

  // Filtra resultados com base na query digitada e na aba selecionada
  const filteredResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();

    return allData.filter((item) => {
      if (selectedTab !== 'all' && item.type !== selectedTab) {
        return false;
      }
      return item.name.toLowerCase().includes(q);
    });
  }, [allData, debouncedQuery, selectedTab]);

  // Contagem por aba para os badges das abas
  const counts = useMemo(() => {
    if (!debouncedQuery) return { all: 0, live: 0, movie: 0, series: 0 };
    const q = debouncedQuery.toLowerCase();
    const matched = allData.filter((i) => i.name.toLowerCase().includes(q));
    return {
      all: matched.length,
      live: matched.filter((i) => i.type === 'live').length,
      movie: matched.filter((i) => i.type === 'movie').length,
      series: matched.filter((i) => i.type === 'series').length,
    };
  }, [allData, debouncedQuery]);

  // Responsividade do Grid (2 a 6 colunas dependendo da largura da tela)
  const numColumns = useMemo(() => {
    if (width > 1200) return 6;
    if (width > 900) return 5;
    if (width > 600) return 4;
    return 3;
  }, [width]);

  const handleItemPress = (item: UnifiedSearchResult) => {
    if (!account) return;

    if (item.type === 'live') {
      const streamUrl = xtreamService.buildLiveStreamUrl(
        account,
        item.id,
        Platform.OS === 'web' ? 'm3u8' : 'ts'
      );
      navigation.navigate('PlayerScreen', {
        streamUrl,
        title: item.name,
        posterUrl: item.posterUrl,
        type: 'live',
        contentId: item.id,
      });
    } else if (item.type === 'movie') {
      navigation.navigate('DetailsScreen', {
        id: item.id,
        type: 'movie',
        title: item.name,
        posterUrl: item.posterUrl,
        containerExtension: item.containerExtension || 'mp4',
      });
    } else {
      navigation.navigate('DetailsScreen', {
        id: item.id,
        type: 'series',
        title: item.name,
        posterUrl: item.posterUrl,
      });
    }
  };

  return (
    <Container testID="search-screen">
      <SearchHeader insetTop={insets.top}>
        <IconButton
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          testID="search-back-button"
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </IconButton>

        <SearchInputWrapper>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <SearchInput
            placeholder="Buscar canais, filmes e séries..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
            autoCorrect={false}
            testID="global-search-input"
          />
          {query.length > 0 && (
            <IconButton
              style={{ width: 28, height: 28, backgroundColor: 'transparent' }}
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              testID="clear-search-button"
            >
              <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.5)" />
            </IconButton>
          )}
        </SearchInputWrapper>
      </SearchHeader>

      {/* Abas de filtro */}
      <TabsContainer>
        <TabButton
          isSelected={selectedTab === 'all'}
          onPress={() => setSelectedTab('all')}
          testID="tab-all"
        >
          <TabButtonText isSelected={selectedTab === 'all'}>
            Todos {debouncedQuery ? `(${counts.all})` : ''}
          </TabButtonText>
        </TabButton>

        <TabButton
          isSelected={selectedTab === 'live'}
          onPress={() => setSelectedTab('live')}
          testID="tab-live"
        >
          <TabButtonText isSelected={selectedTab === 'live'}>
            Canais {debouncedQuery ? `(${counts.live})` : ''}
          </TabButtonText>
        </TabButton>

        <TabButton
          isSelected={selectedTab === 'movie'}
          onPress={() => setSelectedTab('movie')}
          testID="tab-movie"
        >
          <TabButtonText isSelected={selectedTab === 'movie'}>
            Filmes {debouncedQuery ? `(${counts.movie})` : ''}
          </TabButtonText>
        </TabButton>

        <TabButton
          isSelected={selectedTab === 'series'}
          onPress={() => setSelectedTab('series')}
          testID="tab-series"
        >
          <TabButtonText isSelected={selectedTab === 'series'}>
            Séries {debouncedQuery ? `(${counts.series})` : ''}
          </TabButtonText>
        </TabButton>
      </TabsContainer>

      {/* Resultados da busca */}
      <ResultsListWrapper>
        {isLoading && allData.length === 0 ? (
          <LoadingWrapper testID="search-loading">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </LoadingWrapper>
        ) : !debouncedQuery ? (
          <EmptyContainer testID="search-initial-empty">
            <MaterialIcons name="search" size={64} color="rgba(255,255,255,0.15)" />
            <EmptyTitle>O que você quer assistir?</EmptyTitle>
            <EmptySubtitle>
              Digite o nome de um canal ao vivo, filme ou série para pesquisar em todo o catálogo.
            </EmptySubtitle>
          </EmptyContainer>
        ) : filteredResults.length === 0 ? (
          <EmptyContainer testID="search-no-results">
            <MaterialIcons name="sentiment-dissatisfied" size={64} color="rgba(255,255,255,0.2)" />
            <EmptyTitle>Nenhum resultado encontrado</EmptyTitle>
            <EmptySubtitle>
              Não encontramos nenhum conteúdo correspondente a "{debouncedQuery}". Tente pesquisar por outro termo.
            </EmptySubtitle>
          </EmptyContainer>
        ) : (
          <FlatList
            key={`grid-${numColumns}`}
            data={filteredResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            numColumns={numColumns}
            contentContainerStyle={{ padding: 8 }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={18}
            maxToRenderPerBatch={24}
            windowSize={5}
            renderItem={({ item }) => (
              <ResultCard
                onPress={() => handleItemPress(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                testID={`search-result-${item.id}`}
              >
                <ResultPosterWrapper>
                  {item.posterUrl ? (
                    <ResultPoster
                      source={{ uri: item.posterUrl }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <ResultPoster
                      source={require('../../../assets/icon.png')}
                      contentFit="contain"
                    />
                  )}

                  <TypeBadge typeBadge={item.type}>
                    <TypeBadgeText>
                      {item.type === 'live' ? 'Canal' : item.type === 'movie' ? 'Filme' : 'Série'}
                    </TypeBadgeText>
                  </TypeBadge>

                  {Boolean(item.rating && Number(item.rating) > 0) && (
                    <RatingBadge>
                      <MaterialIcons name="star" size={10} color="#ffc107" />
                      <RatingText>{Number(item.rating).toFixed(1)}</RatingText>
                    </RatingBadge>
                  )}
                </ResultPosterWrapper>

                <ResultInfo>
                  <ResultTitle numberOfLines={1}>{item.name}</ResultTitle>
                  <ResultMeta>
                    {item.type === 'live'
                      ? 'Transmissão Ao Vivo'
                      : item.type === 'movie'
                      ? 'Longa-metragem'
                      : 'Série de TV'}
                  </ResultMeta>
                </ResultInfo>
              </ResultCard>
            )}
          />
        )}
      </ResultsListWrapper>
    </Container>
  );
};
