import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Platform, useWindowDimensions, Alert, TouchableOpacity, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { CategoryScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useXtream } from '../../hooks/useXtream';
import { useFavorites } from '../../hooks/useFavorites';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { xtreamService } from '../../services/xtreamService';
import { HeaderGlobal } from '../../components/headerGlobal';
import { InputGlobal } from '../../components/inputGlobal';
import { PosterCardGlobal } from '../../components/posterCardGlobal';
import { ChannelCardGlobal } from '../../components/channelCardGlobal';
import { LoadingGlobal } from '../../components/loadingGlobal';
import { SectionCarouselGlobal } from '../../components/sectionCarouselGlobal';
import { CategoryDrawerGlobal } from '../../components/categoryDrawerGlobal';
import { ConfirmModalGlobal } from '../../components/confirmModalGlobal';
import { IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';
import { cleanSeriesTitle, cleanEpisodeDisplayTitle } from '../../utils/formatters';
import {
  Container,
  SearchRow,
  SearchInputContainer,
  HamburgerButton,
  HamburgerButtonText,
  CategoryTitleRow,
  CategoryTitleText,
  CategoryItemsCount,
  ContentArea,
  EmptyContainer,
  EmptyText,
  EmptyActionButton,
  EmptyActionButtonText,
  SortBarContainer,
  SortPill,
  SortPillText,
} from './style';

type SortMode = 'default' | 'name_asc' | 'name_desc' | 'recent' | 'rating';

const HORIZONTAL_PADDING = 32;
const GAP = 12;

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const numColumns = useMemo(() => {
    if (Platform.OS === 'web') {
      if (windowWidth < 600) return 3;
      if (windowWidth < 900) return 5;
      if (windowWidth < 1200) return 6;
      return 8;
    }
    return 3;
  }, [windowWidth]);

  const posterWidth = useMemo(() => {
    const totalGaps = (numColumns - 1) * GAP;
    return Math.floor((windowWidth - HORIZONTAL_PADDING - totalGaps) / numColumns);
  }, [windowWidth, numColumns]);

  const { type, title } = route.params;
  const { account } = useAuth();
  const {
    categories,
    items,
    isLoading,
    loadingMessage,
    fetchCategories,
    fetchStreams,
    prefetchCategory,
  } = useXtream(account);
  const { favorites, isFavorite, toggleFavorite, reload } = useFavorites();
  const { continueWatching, clearHistory, removeProgress } = useWatchHistory();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isClearHistoryModalVisible, setIsClearHistoryModalVisible] = useState<boolean>(false);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; seriesId?: string; title: string } | null>(null);

  useEffect(() => {
    if (searchQuery.trim() !== debouncedQuery.trim()) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedQuery]);

  const typeFavoritesCount = useMemo(() => {
    return favorites.filter((f) => (type === 'live' ? f.type === 'live' : f.type === type)).length;
  }, [favorites, type]);

  const typeContinueWatchingList = useMemo(() => {
    if (type === 'live') return [];
    const all = continueWatching.filter((p) => p.type === type);
    const map = new Map<string, typeof all[0]>();
    for (const rawItem of all) {
      const item =
        rawItem.type === 'series'
          ? { ...rawItem, title: cleanEpisodeDisplayTitle(rawItem.title) }
          : rawItem;
      const key = type === 'series' && item.seriesId ? item.seriesId : item.id;
      if (!map.has(key) || item.updatedAt > map.get(key)!.updatedAt) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [continueWatching, type]);

  const continueWatchingCount = typeContinueWatchingList.length;

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'favorites') {
      return `Meus Favoritos ${typeFavoritesCount > 0 ? `(${typeFavoritesCount})` : ''}`;
    }
    if (selectedCategory === 'continue_watching') {
      return `Continuar Assistindo ${continueWatchingCount > 0 ? `(${continueWatchingCount})` : ''}`;
    }
    if (selectedCategory === 'all') {
      if (type === 'live') return 'Todos os Canais';
      if (type === 'movie') return 'Todos os Filmes';
      if (type === 'series') return 'Todas as Séries';
      return 'Todos os Conteúdos';
    }
    const cat = categories.find((c) => String(c.category_id) === String(selectedCategory));
    return cat ? cat.category_name : 'Conteúdo';
  }, [selectedCategory, categories, type, typeFavoritesCount, continueWatchingCount]);

  const initializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const cats = await fetchCategories(type);
      if (!isMounted) return;

      if (cats && cats.length > 0) {
        const firstCatId = String(cats[0].category_id);
        setSelectedCategory(firstCatId);
        await fetchStreams(type, firstCatId);

        // Pre-fetch the next 3 categories silently in the background
        const nextCats = cats.slice(1, 4);
        for (const nextCat of nextCats) {
          if (!isMounted) break;
          prefetchCategory(type, String(nextCat.category_id));
        }
      } else {
        setSelectedCategory('all');
        fetchStreams(type, undefined);
      }
      initializedRef.current = true;
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [type, fetchCategories, fetchStreams, prefetchCategory]);

  // When drawer opens, silently pre-fetch the top categories so tapping them is instant
  useEffect(() => {
    if (isDrawerOpen && categories.length > 0) {
      const topCats = categories.slice(0, 6);
      topCats.forEach((c) => {
        prefetchCategory(type, String(c.category_id));
      });
    }
  }, [isDrawerOpen, categories, type, prefetchCategory]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      setIsDrawerOpen(false);
      if (categoryId !== 'favorites' && categoryId !== 'continue_watching') {
        fetchStreams(type, categoryId === 'all' ? undefined : categoryId);
      }
    },
    [type, fetchStreams]
  );

  const filteredItems = useMemo(() => {
    let result: (IXtreamLiveStream | IXtreamVodStream | IXtreamSeries)[] = [];

    if (selectedCategory === 'favorites') {
      const typeFavs = favorites.filter((f) =>
        type === 'live' ? f.type === 'live' : f.type === type
      );
      result = typeFavs.map((fav) => {
        const existing = (items || []).find((item) => {
          if (!item) return false;
          const id =
            'stream_id' in item
              ? String(item.stream_id)
              : String((item as IXtreamSeries).series_id);
          return id === String(fav.id);
        });
        if (existing) return existing;

        if (type === 'live') {
          return {
            num: 0,
            name: fav.name,
            stream_type: 'live',
            stream_id: Number(fav.id) || fav.id,
            stream_icon: fav.posterUrl,
            epg_channel_id: '',
            added: String(fav.addedAt),
            category_id: fav.categoryId || '',
            custom_sid: '',
            tv_archive: 0,
            direct_source: '',
            tv_archive_duration: 0,
          } as unknown as IXtreamLiveStream;
        } else if (type === 'series') {
          return {
            num: 0,
            name: fav.name,
            series_id: Number(fav.id) || fav.id,
            cover: fav.posterUrl,
            plot: '',
            cast: '',
            director: '',
            genre: '',
            releaseDate: '',
            last_modified: '',
            rating: fav.rating || '',
            rating_5based: 0,
            backdrop_path: [],
            youtube_trailer: '',
            episode_run_time: '',
            category_id: fav.categoryId || '',
          } as unknown as IXtreamSeries;
        } else {
          return {
            num: 0,
            name: fav.name,
            stream_type: 'movie',
            stream_id: Number(fav.id) || fav.id,
            stream_icon: fav.posterUrl,
            rating: fav.rating || '',
            rating_5based: 0,
            added: String(fav.addedAt),
            category_id: fav.categoryId || '',
            container_extension: 'mp4',
            custom_sid: '',
            direct_source: '',
          } as unknown as IXtreamVodStream;
        }
      });
    } else if (selectedCategory === 'continue_watching') {
      result = typeContinueWatchingList.map((item) => {
        if (type === 'series') {
          return {
            num: 0,
            name: item.title,
            series_id: item.seriesId || item.id,
            cover: item.posterUrl,
            plot: '',
            cast: '',
            director: '',
            genre: '',
            releaseDate: '',
            last_modified: '',
            rating: '',
            rating_5based: 0,
            backdrop_path: [],
            youtube_trailer: '',
            episode_run_time: '',
            category_id: 'continue_watching',
          } as unknown as IXtreamSeries;
        } else {
          return {
            num: 0,
            name: item.title,
            stream_type: 'movie',
            stream_id: Number(item.id) || item.id,
            stream_icon: item.posterUrl,
            rating: '',
            rating_5based: 0,
            added: String(item.updatedAt),
            category_id: 'continue_watching',
            container_extension: 'mp4',
            custom_sid: '',
            direct_source: '',
          } as unknown as IXtreamVodStream;
        }
      });
    } else {
      result = items || [];
      if (selectedCategory !== 'all') {
        const hasOtherCategories = result.some(
          (item) => item && item.category_id != null && String(item.category_id) !== String(selectedCategory)
        );
        if (hasOtherCategories) {
          result = result.filter(
            (item) => item && String(item.category_id) === String(selectedCategory)
          );
        }
      }
    }

    const q = (debouncedQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const name = item?.name ? String(item.name).toLowerCase() : '';
        return name.includes(q);
      });
    }

    if (sortMode === 'name_asc') {
      result = [...result].sort((a, b) => {
        const nameA = a?.name ? String(a.name).toLowerCase() : '';
        const nameB = b?.name ? String(b.name).toLowerCase() : '';
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      });
    } else if (sortMode === 'name_desc') {
      result = [...result].sort((a, b) => {
        const nameA = a?.name ? String(a.name).toLowerCase() : '';
        const nameB = b?.name ? String(b.name).toLowerCase() : '';
        return nameB < nameA ? -1 : nameB > nameA ? 1 : 0;
      });
    } else if (sortMode === 'recent') {
      result = [...result].sort((a, b) => {
        const dateA = Number((a as any)?.added || (a as any)?.last_modified || 0) || 0;
        const dateB = Number((b as any)?.added || (b as any)?.last_modified || 0) || 0;
        return dateB - dateA;
      });
    } else if (sortMode === 'rating' && type !== 'live') {
      result = [...result].sort((a, b) => {
        const rateA = Number((a as any)?.rating || (a as any)?.rating_5based || 0) || 0;
        const rateB = Number((b as any)?.rating || (b as any)?.rating_5based || 0) || 0;
        return rateB - rateA;
      });
    }

    return result;
  }, [items, selectedCategory, debouncedQuery, favorites, type, typeContinueWatchingList, sortMode]);

  const handleRefresh = useCallback(() => {
    if (selectedCategory === 'favorites') {
      reload();
    } else if (selectedCategory === 'continue_watching') {
      // reactively updated
    } else {
      fetchStreams(type, selectedCategory === 'all' ? undefined : selectedCategory, true);
    }
  }, [selectedCategory, reload, fetchStreams, type]);

  const handleConfirmClearHistory = useCallback(() => {
    setIsClearHistoryModalVisible(true);
  }, []);

  const handleConfirmRemoveItem = useCallback(
    (item: { id: string; seriesId?: string; title: string }) => {
      setItemToRemove(item);
    },
    []
  );


  const handleLivePlay = useCallback(
    (stream: IXtreamLiveStream) => {
      if (!account) return;
      const streamUrl = xtreamService.buildLiveStreamUrl(
        account,
        stream.stream_id,
        Platform.OS === 'web' ? 'm3u8' : 'ts'
      );

      const liveChannels = (filteredItems as IXtreamLiveStream[])
        .filter((item) => item && item.stream_id)
        .map((s) => ({
          id: String(s.stream_id),
          name: s.name,
          streamUrl: xtreamService.buildLiveStreamUrl(
            account,
            s.stream_id,
            Platform.OS === 'web' ? 'm3u8' : 'ts'
          ),
          logoUrl: s.stream_icon,
          streamId: s.stream_id,
          epgChannelId: s.epg_channel_id,
        }));

      navigation.navigate('PlayerScreen', {
        streamUrl,
        title: stream.name,
        posterUrl: stream.stream_icon,
        type: 'live',
        contentId: String(stream.stream_id),
        liveChannels,
      });
    },
    [account, navigation, filteredItems]
  );

  const handleVodSelect = useCallback(
    (stream: IXtreamVodStream) => {
      navigation.navigate('DetailsScreen', {
        id: String(stream.stream_id),
        type: 'movie',
        title: stream.name,
        posterUrl: stream.stream_icon,
        containerExtension: stream.container_extension || 'mp4',
      });
    },
    [navigation]
  );

  const handleSeriesSelect = useCallback(
    (series: IXtreamSeries) => {
      navigation.navigate('DetailsScreen', {
        id: String(series.series_id),
        type: 'series',
        title: cleanSeriesTitle(series.name),
        posterUrl: series.cover,
      });
    },
    [navigation]
  );

  const keyExtractorLive = useCallback(
    (item: IXtreamLiveStream) => `live-${item.stream_id}`,
    []
  );

  const keyExtractorVod = useCallback(
    (item: IXtreamVodStream | IXtreamSeries) =>
      `item-${'stream_id' in item ? item.stream_id : item.series_id}`,
    []
  );

  const renderLiveItem = useCallback(
    ({ item }: { item: IXtreamLiveStream }) => (
      <ChannelCardGlobal
        name={item.name}
        logoUrl={item.stream_icon}
        channelNumber={item.num}
        isFavorite={isFavorite(String(item.stream_id))}
        onToggleFavorite={() =>
          toggleFavorite({
            id: String(item.stream_id),
            name: item.name,
            posterUrl: item.stream_icon || '',
            type: 'live',
            categoryId: item.category_id,
            addedAt: Date.now(),
          })
        }
        onPlay={() => handleLivePlay(item)}
      />
    ),
    [isFavorite, toggleFavorite, handleLivePlay]
  );

  const renderVodItem = useCallback(
    ({ item }: { item: IXtreamVodStream | IXtreamSeries }) => {
      const posterUrl =
        'stream_icon' in item ? item.stream_icon : (item as IXtreamSeries).cover;
      const contentId = 'stream_id' in item ? String(item.stream_id) : String(item.series_id);
      const isContinueWatching = selectedCategory === 'continue_watching';
      const cwItem = isContinueWatching
        ? typeContinueWatchingList.find(
            (c) => String(c.id) === contentId || String(c.seriesId) === contentId
          )
        : undefined;

      return (
        <PosterCardGlobal
          title={item.name}
          posterUrl={posterUrl}
          rating={item.rating}
          percentage={cwItem?.percentage}
          width={posterWidth}
          onPress={() =>
            'stream_id' in item
              ? handleVodSelect(item as IXtreamVodStream)
              : handleSeriesSelect(item as IXtreamSeries)
          }
          onRemove={
            isContinueWatching
              ? () =>
                  handleConfirmRemoveItem({
                    id: contentId,
                    seriesId: 'series_id' in item ? String(item.series_id) : undefined,
                    title: item.name,
                  })
              : undefined
          }
        />
      );
    },
    [
      handleVodSelect,
      handleSeriesSelect,
      posterWidth,
      selectedCategory,
      typeContinueWatchingList,
      handleConfirmRemoveItem,
    ]
  );


  const renderCategoryFolderRow = useCallback(
    () => {
      if (selectedCategory === 'continue_watching') {
        return (
          <View
            style={{
              marginHorizontal: type === 'live' ? 16 : 0,
              marginBottom: 16,
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: 'rgba(229, 9, 20, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="history" size={22} color="#E50914" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}
                  >
                    Continuar Assistindo
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {filteredItems.length} {filteredItems.length === 1 ? 'item em andamento' : 'itens em andamento'} • Toque no X ou segure no card para remover
                  </Text>
                </View>
              </View>

              {filteredItems.length > 0 && (
                <TouchableOpacity
                  onPress={handleConfirmClearHistory}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar histórico"
                  testID="clear-history-button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: '#E50914',
                    marginLeft: 12,
                  }}
                >
                  <MaterialIcons
                    name="delete"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    Limpar Tudo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }

      return (
        <CategoryTitleRow
          onPress={() => setIsDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Alterar lista"
          testID="active-category-row"
          style={
            type !== 'live'
              ? {
                  paddingHorizontal: 0,
                  paddingTop: Platform.OS === 'web' ? 12 : 6,
                  paddingBottom: 12,
                }
              : {
                  paddingTop: Platform.OS === 'web' ? 12 : 6,
                  paddingBottom: 8,
                }
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialIcons
              name={selectedCategory === 'favorites' ? 'favorite' : 'folder'}
              size={20}
              color={
                selectedCategory === 'favorites' ? '#E50914' : theme.colors.primary
              }
              style={{ marginRight: 8 }}
            />
            <CategoryTitleText numberOfLines={1} style={{ flexShrink: 1 }}>
              {selectedCategoryName}
            </CategoryTitleText>
          </View>
          <CategoryItemsCount>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
          </CategoryItemsCount>
        </CategoryTitleRow>
      );
    },
    [
      selectedCategory,
      selectedCategoryName,
      filteredItems.length,
      type,
      theme,
      handleConfirmClearHistory,
    ]
  );

  const renderVodHeader = useCallback(
    () => (
      <View style={{ marginBottom: 4 }}>
        {renderCategoryFolderRow()}
      </View>
    ),
    [renderCategoryFolderRow]
  );

  const renderEmptyComponent = useCallback(() => {
    if (isLoading || isSearching) return null;
    return (
      <EmptyContainer>
        {debouncedQuery.trim().length > 0 ? (
          <>
            <EmptyText>Nenhum resultado encontrado para "{debouncedQuery}".</EmptyText>
            <EmptyActionButton
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
            >
              <EmptyActionButtonText>Limpar Busca</EmptyActionButtonText>
            </EmptyActionButton>
          </>
        ) : selectedCategory === 'continue_watching' ? (
          <>
            <EmptyText>Você não tem conteúdos em andamento no Continuar Assistindo.</EmptyText>
            <EmptyActionButton
              onPress={() => setIsDrawerOpen(true)}
              accessibilityRole="button"
              testID="open-drawer-from-empty"
            >
              <EmptyActionButtonText>Escolher Outra Lista</EmptyActionButtonText>
            </EmptyActionButton>
          </>
        ) : selectedCategory === 'favorites' ? (
          <>
            <EmptyText>Você ainda não tem favoritos salvos nesta seção.</EmptyText>
            <EmptyActionButton
              onPress={() => setIsDrawerOpen(true)}
              accessibilityRole="button"
              testID="open-drawer-from-empty"
            >
              <EmptyActionButtonText>Abrir Listas / Categorias</EmptyActionButtonText>
            </EmptyActionButton>
          </>
        ) : (
          <>
            <EmptyText>Nenhum conteúdo encontrado nesta lista.</EmptyText>
            <EmptyActionButton
              onPress={() => setIsDrawerOpen(true)}
              accessibilityRole="button"
              testID="open-drawer-from-empty"
            >
              <EmptyActionButtonText>Escolher Outra Lista</EmptyActionButtonText>
            </EmptyActionButton>
          </>
        )}
      </EmptyContainer>
    );
  }, [isLoading, isSearching, debouncedQuery, selectedCategory]);

  return (
    <Container testID="category-screen">
      <HeaderGlobal
        title={title}
        onBack={() => navigation.goBack()}
        showCast={true}
      />

      <SearchRow>
        <HamburgerButton
          onPress={() => setIsDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu de listas e categorias"
          testID="open-category-drawer"
        >
          <MaterialIcons name="menu" size={24} color={theme.colors.text} />
          <HamburgerButtonText>Listas</HamburgerButtonText>
        </HamburgerButton>

        <SearchInputContainer>
          <InputGlobal
            placeholder={`Buscar em ${title}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            noMargin
          />
        </SearchInputContainer>
      </SearchRow>

      <SortBarContainer testID="sort-bar-container">
        <SortPill
          isSelected={sortMode === 'default'}
          onPress={() => setSortMode('default')}
          accessibilityRole="button"
          accessibilityLabel="Ordenar por Padrão"
          testID="sort-pill-default"
        >
          <MaterialIcons
            name="sort"
            size={14}
            color={sortMode === 'default' ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
            style={{ marginRight: 4 }}
          />
          <SortPillText isSelected={sortMode === 'default'}>Padrão</SortPillText>
        </SortPill>

        <SortPill
          isSelected={sortMode === 'name_asc'}
          onPress={() => setSortMode('name_asc')}
          accessibilityRole="button"
          accessibilityLabel="Ordenar de A a Z"
          testID="sort-pill-name-asc"
        >
          <MaterialIcons
            name="arrow-upward"
            size={14}
            color={sortMode === 'name_asc' ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
            style={{ marginRight: 4 }}
          />
          <SortPillText isSelected={sortMode === 'name_asc'}>A-Z</SortPillText>
        </SortPill>

        <SortPill
          isSelected={sortMode === 'name_desc'}
          onPress={() => setSortMode('name_desc')}
          accessibilityRole="button"
          accessibilityLabel="Ordenar de Z a A"
          testID="sort-pill-name-desc"
        >
          <MaterialIcons
            name="arrow-downward"
            size={14}
            color={sortMode === 'name_desc' ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
            style={{ marginRight: 4 }}
          />
          <SortPillText isSelected={sortMode === 'name_desc'}>Z-A</SortPillText>
        </SortPill>

        <SortPill
          isSelected={sortMode === 'recent'}
          onPress={() => setSortMode('recent')}
          accessibilityRole="button"
          accessibilityLabel="Ordenar por Recentes"
          testID="sort-pill-recent"
        >
          <MaterialIcons
            name="new-releases"
            size={14}
            color={sortMode === 'recent' ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
            style={{ marginRight: 4 }}
          />
          <SortPillText isSelected={sortMode === 'recent'}>Recentes</SortPillText>
        </SortPill>

        {type !== 'live' && (
          <SortPill
            isSelected={sortMode === 'rating'}
            onPress={() => setSortMode('rating')}
            accessibilityRole="button"
            accessibilityLabel="Ordenar por Melhor Avaliados"
            testID="sort-pill-rating"
          >
            <MaterialIcons
              name="star"
              size={14}
              color={sortMode === 'rating' ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
              style={{ marginRight: 4 }}
            />
            <SortPillText isSelected={sortMode === 'rating'}>Melhor Avaliados</SortPillText>
          </SortPill>
        )}
      </SortBarContainer>

      {/* Para Canais Ao Vivo, exibe o nome da categoria no topo */}
      {type === 'live' && renderCategoryFolderRow()}

      <ContentArea>
        {isLoading ? (
          <LoadingGlobal message={loadingMessage} />
        ) : isSearching ? (
          <LoadingGlobal message="Buscando conteúdos..." />
        ) : type === 'live' ? (
          filteredItems.length === 0 ? (
            renderEmptyComponent()
          ) : (
            <FlashList
              data={filteredItems as IXtreamLiveStream[]}
              keyExtractor={keyExtractorLive}
              renderItem={renderLiveItem}
              drawDistance={windowWidth * 2}
              refreshing={isLoading}
              onRefresh={handleRefresh}
            />
          )
        ) : (
          <FlashList
            key={`vod-grid-${numColumns}`}
            data={filteredItems as Array<IXtreamVodStream | IXtreamSeries>}
            numColumns={numColumns}
            keyExtractor={keyExtractorVod}
            renderItem={renderVodItem}
            drawDistance={windowWidth * 3}
            refreshing={isLoading}
            onRefresh={handleRefresh}
            ListHeaderComponent={renderVodHeader}
            ListEmptyComponent={renderEmptyComponent}
          />
        )}
      </ContentArea>

      <CategoryDrawerGlobal
        visible={isDrawerOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        onClose={() => setIsDrawerOpen(false)}
        favoritesCount={typeFavoritesCount}
        continueWatchingCount={continueWatchingCount}
        type={type}
      />

      <ConfirmModalGlobal
        visible={isClearHistoryModalVisible}
        title="Limpar Histórico"
        description={`Deseja limpar todo o histórico de Continuar Assistindo ${type === 'series' ? 'de Séries' : 'de Filmes'}? Esta ação não pode ser desfeita.`}
        confirmText="Apagar Tudo"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-sweep"
        onConfirm={() => {
          setIsClearHistoryModalVisible(false);
          clearHistory(type);
        }}
        onCancel={() => setIsClearHistoryModalVisible(false)}
        testID="category-clear-history-modal"
      />

      <ConfirmModalGlobal
        visible={Boolean(itemToRemove)}
        title="Remover do Histórico"
        description={
          itemToRemove
            ? `Deseja remover "${itemToRemove.title}" do Continuar Assistindo?`
            : ''
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-outline"
        onConfirm={() => {
          if (itemToRemove) {
            removeProgress(itemToRemove.id, itemToRemove.seriesId);
            setItemToRemove(null);
          }
        }}
        onCancel={() => setItemToRemove(null)}
        testID="category-remove-item-modal"
      />
    </Container>
  );
};
