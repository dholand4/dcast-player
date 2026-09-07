import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { CategoryScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useXtream } from '../../hooks/useXtream';
import { useFavorites } from '../../hooks/useFavorites';
import { xtreamService } from '../../services/xtreamService';
import { HeaderGlobal } from '../../components/headerGlobal';
import { InputGlobal } from '../../components/inputGlobal';
import { PosterCardGlobal } from '../../components/posterCardGlobal';
import { ChannelCardGlobal } from '../../components/channelCardGlobal';
import { LoadingGlobal } from '../../components/loadingGlobal';
import { CategoryDrawerGlobal } from '../../components/categoryDrawerGlobal';
import { IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';
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
} from './style';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 32;
const GAP = 12;
const POSTER_WIDTH = Math.floor((SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * 2) / 3);

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  route,
  navigation,
}) => {
  const theme = useTheme();
  const { type, title } = route.params;
  const { account } = useAuth();
  const { categories, items, isLoading, loadingMessage, fetchCategories, fetchStreams } =
    useXtream(account);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

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

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'favorites') {
      return `Meus Favoritos ${typeFavoritesCount > 0 ? `(${typeFavoritesCount})` : ''}`;
    }
    if (selectedCategory === 'all') {
      if (type === 'live') return 'Todos os Canais';
      if (type === 'movie') return 'Todos os Filmes';
      if (type === 'series') return 'Todas as Séries';
      return 'Todos os Conteúdos';
    }
    const cat = categories.find((c) => String(c.category_id) === String(selectedCategory));
    return cat ? cat.category_name : 'Conteúdo';
  }, [selectedCategory, categories, type, typeFavoritesCount]);

  useEffect(() => {
    fetchCategories(type);
    fetchStreams(type);
  }, [type, fetchCategories, fetchStreams]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const filteredItems = useMemo(() => {
    let result = items || [];
    if (selectedCategory === 'favorites') {
      result = result.filter((item) => {
        if (!item) return false;
        const id =
          'stream_id' in item
            ? String(item.stream_id)
            : String((item as IXtreamSeries).series_id);
        return isFavorite(id);
      });
    } else if (selectedCategory !== 'all') {
      result = result.filter(
        (item) => item && String(item.category_id) === String(selectedCategory)
      );
    }

    const q = (debouncedQuery || '').trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        const name = item?.name ? String(item.name).toLowerCase() : '';
        return name.includes(q);
      });
    }
    return result;
  }, [items, selectedCategory, debouncedQuery, isFavorite]);


  const handleLivePlay = useCallback(
    (stream: IXtreamLiveStream) => {
      if (!account) return;
      const streamUrl = xtreamService.buildLiveStreamUrl(account, stream.stream_id);
      navigation.navigate('PlayerScreen', {
        streamUrl,
        title: stream.name,
        posterUrl: stream.stream_icon,
        type: 'live',
        contentId: String(stream.stream_id),
      });
    },
    [account, navigation]
  );

  const handleVodSelect = useCallback(
    (stream: IXtreamVodStream) => {
      navigation.navigate('DetailsScreen', {
        id: String(stream.stream_id),
        type: 'movie',
        title: stream.name,
        posterUrl: stream.stream_icon,
      });
    },
    [navigation]
  );

  const handleSeriesSelect = useCallback(
    (series: IXtreamSeries) => {
      navigation.navigate('DetailsScreen', {
        id: String(series.series_id),
        type: 'series',
        title: series.name,
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
      return (
        <PosterCardGlobal
          title={item.name}
          posterUrl={posterUrl}
          rating={item.rating}
          width={POSTER_WIDTH}
          onPress={() =>
            'stream_id' in item
              ? handleVodSelect(item as IXtreamVodStream)
              : handleSeriesSelect(item as IXtreamSeries)
          }
        />
      );
    },
    [handleVodSelect, handleSeriesSelect]
  );

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

      {/* Nome Limpo da Categoria Atual com Acesso ao Menu Lateral */}
      <CategoryTitleRow
        onPress={() => setIsDrawerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Alterar lista"
        testID="active-category-row"
      >
        <CategoryTitleText>{selectedCategoryName}</CategoryTitleText>
        <CategoryItemsCount>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
        </CategoryItemsCount>
      </CategoryTitleRow>

      <ContentArea>
        {isLoading && items.length === 0 ? (
          <LoadingGlobal message={loadingMessage} />
        ) : isSearching ? (
          <LoadingGlobal message="Buscando conteúdos..." />
        ) : filteredItems.length === 0 ? (
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
                <EmptyText>Nenhum conteúdo encontrado nesta categoria.</EmptyText>
                <EmptyActionButton
                  onPress={() => handleCategorySelect('all')}
                  accessibilityRole="button"
                >
                  <EmptyActionButtonText>Ver Todos os Conteúdos</EmptyActionButtonText>
                </EmptyActionButton>
              </>
            )}
          </EmptyContainer>
        ) : type === 'live' ? (
          <FlashList
            data={filteredItems as IXtreamLiveStream[]}
            keyExtractor={keyExtractorLive}
            renderItem={renderLiveItem}
            refreshing={isLoading}
            onRefresh={() => fetchStreams(type, undefined, true)}
          />
        ) : (
          <FlashList
            data={filteredItems as Array<IXtreamVodStream | IXtreamSeries>}
            numColumns={3}
            keyExtractor={keyExtractorVod}
            renderItem={renderVodItem}
            refreshing={isLoading}
            onRefresh={() => fetchStreams(type, undefined, true)}
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
      />
    </Container>
  );
};
