import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useProfiles } from '../../hooks/useProfiles';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { useNewEpisodes } from '../../hooks/useNewEpisodes';
import { useFavorites } from '../../hooks/useFavorites';
import { clearXtreamCache } from '../../hooks/useXtream';
import { storageService } from '../../services/storageService';
import { xtreamService, extractDirectUrl } from '../../services/xtreamService';
import { catalogSyncService } from '../../services/catalogSyncService';
import { HeaderGlobal } from '../../components/headerGlobal';
import { MainNavCardsGlobal } from '../../components/mainNavCardsGlobal';
import { SectionCarouselGlobal } from '../../components/sectionCarouselGlobal';
import { PosterCardGlobal } from '../../components/posterCardGlobal';
import { NetworkDiagnosticModal } from '../../components/networkDiagnosticModal';
import { ConfirmModalGlobal } from '../../components/confirmModalGlobal';
import {
  formatExpirationDate,
  cleanSeriesTitle,
  cleanEpisodeDisplayTitle,
} from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import {
  Container,
  ScrollArea,
  AccountWarningCard,
  AccountWarningText,
  ProfileAvatar,
  SubscriptionCard,
  SubscriptionInfo,
  SubscriptionText,
  ExpirationBadge,
  ExpirationBadgeText,
  QuickActionsRow,
  QuickActionButton,
  QuickActionText,
} from './style';

// Mesmo espaço entre os cards de Filmes/Séries/TV e a primeira fileira e entre as fileiras.
// O pôster já tem 16px de margem embaixo; o carrossel completa com 4px.
const ROW_GAP = 20;
const CAROUSEL_STYLE = { marginBottom: ROW_GAP - 16 };

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { account, userInfo, accountWarning } = useAuth();
  const { activeProfile, switchProfile } = useProfiles();
  const { continueWatching, hideFromContinueWatching, hideAllFromContinueWatching } =
    useWatchHistory();
  const newEpisodes = useNewEpisodes(account, continueWatching);
  const { favorites, toggleFavorite } = useFavorites();

  // Filmes e séries juntos, do favoritado mais recente para o mais antigo
  const favoriteTitles = useMemo(
    () => favorites.filter((item) => item.type === 'movie' || item.type === 'series'),
    [favorites]
  );
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExitProfileModalVisible, setIsExitProfileModalVisible] = useState(false);
  const [isClearHistoryModalVisible, setIsClearHistoryModalVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{ id: string; seriesId?: string; title: string } | null>(null);
  const [syncModal, setSyncModal] = useState<{
    visible: boolean;
    success: boolean;
    title: string;
    description: string;
  }>({
    visible: false,
    success: true,
    title: '',
    description: '',
  });
  const formattedExpDate = formatExpirationDate(userInfo?.exp_date);

  const collapsedContinueWatching = useMemo(() => {
    const map = new Map<string, typeof continueWatching[0]>();
    for (const rawItem of continueWatching) {
      const item =
        rawItem.type === 'series'
          ? { ...rawItem, title: cleanEpisodeDisplayTitle(rawItem.title) }
          : rawItem;
      const key = item.type === 'series' ? item.seriesId || item.id : item.id;
      const existing = map.get(key);
      if (!existing || item.updatedAt > existing.updatedAt) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [continueWatching]);

  const handleConfirmClearHistory = useCallback(() => {
    setIsClearHistoryModalVisible(true);
  }, []);

  const handleConfirmRemoveItem = useCallback(
    (item: { id: string; seriesId?: string; title: string }) => {
      setItemToRemove(item);
    },
    []
  );

  useEffect(() => {
    if (!account) return;
    const cleanup = catalogSyncService.startBackgroundQueue(account);
    return cleanup;
  }, [account]);

  const handleSyncCatalog = useCallback(async () => {
    setIsSyncing(true);
    try {
      clearXtreamCache();
      storageService.clearCatalogCache();
      catalogSyncService.resetThrottle();
      if (account) {
        try {
          const authData = await xtreamService.authenticate(account);
          if (authData?.user_info) {
            storageService.saveUserInfo(authData.user_info);
          }
        } catch {
          // ignore auth error during sync
        }
        catalogSyncService.syncLiveCatalog(account, true);
      }

      setSyncModal({
        visible: true,
        success: true,
        title: 'Catálogo Atualizado',
        description:
          'Sua conexão com o servidor foi revalidada e o catálogo de canais, filmes e séries foi atualizado com sucesso.',
      });
    } catch {
      setSyncModal({
        visible: true,
        success: false,
        title: 'Erro na Atualização',
        description:
          'Não foi possível atualizar o catálogo. Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [account]);

  return (
    <Container testID="home-screen">
      <HeaderGlobal
        title={activeProfile?.name || 'DCast Player'}
        onSearchPress={() => navigation.navigate('SearchScreen')}
        leftAccessory={
          activeProfile ? (
            <ProfileAvatar color={activeProfile.color}>
              <MaterialIcons name="person" size={22} color="#FFFFFF" />
            </ProfileAvatar>
          ) : undefined
        }
        onTitlePress={activeProfile ? () => setIsExitProfileModalVisible(true) : undefined}
        titleAccessibilityLabel={
          activeProfile ? `Perfil ${activeProfile.name}. Opções do perfil` : undefined
        }
      />

      <ScrollArea>
        {accountWarning && (
          <AccountWarningCard testID="account-warning">
            <MaterialIcons name="warning-amber" size={20} color="#FFB300" />
            <AccountWarningText>{accountWarning}</AccountWarningText>
          </AccountWarningCard>
        )}

        {account && (
          <SubscriptionCard testID="subscription-card">
            <SubscriptionInfo>
              <MaterialIcons name="verified" size={16} color="#46D369" />
              <SubscriptionText>
                {account.label || 'Lista Conectada'} • @{account.username}
              </SubscriptionText>
            </SubscriptionInfo>
            <ExpirationBadge>
              <ExpirationBadgeText>{formattedExpDate}</ExpirationBadgeText>
            </ExpirationBadge>
          </SubscriptionCard>
        )}

        <QuickActionsRow testID="quick-actions-row">
          <QuickActionButton
            onPress={handleSyncCatalog}
            disabled={isSyncing}
            accessibilityRole="button"
            accessibilityLabel="Atualizar lista de canais, filmes e séries"
            testID="sync-catalog-button"
            style={{ opacity: isSyncing ? 0.6 : 1 }}
          >
            <MaterialIcons
              name={isSyncing ? 'hourglass-empty' : 'sync'}
              size={20}
              color="#29B6F6"
            />
            <QuickActionText numberOfLines={1} adjustsFontSizeToFit>
              {isSyncing ? 'Atualizando...' : 'Atualizar Lista'}
            </QuickActionText>
          </QuickActionButton>

          <QuickActionButton
            onPress={() => setIsDiagnosticOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Diagnóstico e velocidade da conexão"
            testID="network-diagnostic-button"
          >
            <MaterialIcons name="speed" size={20} color="#46D369" />
            <QuickActionText numberOfLines={1} adjustsFontSizeToFit>
              Testar Conexão
            </QuickActionText>
          </QuickActionButton>
        </QuickActionsRow>

        <MainNavCardsGlobal
          onSelectLive={() =>
            navigation.navigate('CategoryScreen', {
              type: 'live',
              title: 'Canais Ao Vivo',
            })
          }
          onSelectMovies={() =>
            navigation.navigate('CategoryScreen', {
              type: 'movie',
              title: 'Filmes',
            })
          }
          onSelectSeries={() =>
            navigation.navigate('CategoryScreen', {
              type: 'series',
              title: 'Séries',
            })
          }
        />

        {collapsedContinueWatching.length > 0 && (
          <View style={{ marginTop: ROW_GAP }}>
            <SectionCarouselGlobal
              title="Continuar Assistindo"
              style={CAROUSEL_STYLE}
              data={collapsedContinueWatching}
              keyExtractor={(item) => `home-cw-${item.id}`}
              rightAction={
                <TouchableOpacity
                  onPress={handleConfirmClearHistory}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar todo o continuar assistindo"
                  testID="clear-home-cw-button"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: 'rgba(229, 9, 20, 0.15)',
                    borderWidth: 1,
                    borderColor: '#E50914',
                  }}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={14}
                    color="#E50914"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ color: '#E50914', fontSize: 11, fontWeight: 'bold' }}>
                    Limpar Tudo
                  </Text>
                </TouchableOpacity>
              }
              renderItem={(item) => (
                <PosterCardGlobal
                  title={item.title}
                  posterUrl={item.posterUrl}
                  width={130}
                  percentage={item.percentage}
                  onPress={() => {
                    if (item.type === 'series') {
                      const streamUrl = account
                        ? xtreamService.buildSeriesStreamUrl(account, item.id, 'mp4')
                        : extractDirectUrl(item.streamUrl || '');
                      if (!streamUrl) return;
                      navigation.navigate('PlayerScreen', {
                        streamUrl,
                        title: item.title,
                        posterUrl: item.posterUrl,
                        type: 'series',
                        contentId: String(item.id),
                        seriesId: item.seriesId ? String(item.seriesId) : undefined,
                        seasonNumber: item.seasonNumber,
                        episodeNumber: item.episodeNumber,
                        initialTime: item.currentTime || 0,
                      });
                    } else if (item.type === 'movie') {
                      const streamUrl = account
                        ? xtreamService.buildVodStreamUrl(account, item.id, 'mp4')
                        : extractDirectUrl(item.streamUrl || '');
                      if (!streamUrl) return;
                      navigation.navigate('PlayerScreen', {
                        streamUrl,
                        title: item.title,
                        posterUrl: item.posterUrl,
                        type: 'movie',
                        contentId: String(item.id),
                        initialTime: item.currentTime || 0,
                      });
                    } else {
                      const streamUrl = account
                        ? xtreamService.buildLiveStreamUrl(account, item.id)
                        : extractDirectUrl(item.streamUrl || '');
                      navigation.navigate('PlayerScreen', {
                        streamUrl,
                        title: item.title,
                        posterUrl: item.posterUrl,
                        type: 'live',
                        contentId: String(item.id),
                      });
                    }
                  }}
                  onRemove={() => handleConfirmRemoveItem(item)}
                />
              )}
            />
          </View>
        )}

        {favoriteTitles.length > 0 && (
          <View style={{ marginTop: collapsedContinueWatching.length > 0 ? 0 : ROW_GAP }}>
            <SectionCarouselGlobal
              title="Meus Favoritos"
              style={CAROUSEL_STYLE}
              data={favoriteTitles}
              keyExtractor={(item) => `home-fav-${item.type}-${item.id}`}
              testID="home-favorites"
              renderItem={(item) => (
                <PosterCardGlobal
                  title={item.name}
                  posterUrl={item.posterUrl}
                  rating={item.rating}
                  width={130}
                  testID={`home-fav-${item.id}`}
                  onPress={() =>
                    navigation.navigate('DetailsScreen', {
                      id: String(item.id),
                      type: item.type as 'movie' | 'series',
                      title: item.name,
                      posterUrl: item.posterUrl,
                    })
                  }
                  onLongPress={() => {
                    toggleFavorite(item);
                    showToast('Removido dos favoritos');
                  }}
                />
              )}
            />
          </View>
        )}

        {newEpisodes.length > 0 && (
          <View
            style={{
              marginTop:
                collapsedContinueWatching.length > 0 || favoriteTitles.length > 0 ? 0 : ROW_GAP,
            }}
          >
            <SectionCarouselGlobal
              title="Novos Episódios"
              style={CAROUSEL_STYLE}
              data={newEpisodes}
              keyExtractor={(item) => `home-new-${item.seriesId}`}
              testID="home-new-episodes"
              renderItem={(item) => (
                <PosterCardGlobal
                  title={`${item.seriesTitle} • T${item.episode.season}E${item.episode.episode}${
                    item.newCount > 1 ? ` +${item.newCount - 1}` : ''
                  }`}
                  posterUrl={item.posterUrl}
                  width={130}
                  onPress={() =>
                    navigation.navigate('DetailsScreen', {
                      id: item.seriesId,
                      type: 'series',
                      title: item.seriesTitle,
                      posterUrl: item.posterUrl,
                    })
                  }
                />
              )}
            />
          </View>
        )}
      </ScrollArea>

      <NetworkDiagnosticModal
        visible={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        account={account}
      />

      <ConfirmModalGlobal
        visible={isExitProfileModalVisible}
        title="Sair do perfil"
        description={`Sair do perfil "${activeProfile?.name ?? ''}"? Você volta para a escolha de perfil, onde também pode trocar de lista.`}
        confirmText="Sair"
        cancelText="Cancelar"
        variant="warning"
        iconName="logout"
        onConfirm={() => {
          setIsExitProfileModalVisible(false);
          switchProfile();
        }}
        onCancel={() => setIsExitProfileModalVisible(false)}
        testID="home-exit-profile-modal"
      />

      <ConfirmModalGlobal
        visible={isClearHistoryModalVisible}
        title="Limpar Continuar Assistindo"
        description="Deseja limpar a lista de Continuar Assistindo? Os episódios assistidos continuam marcados."
        confirmText="Limpar"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-sweep"
        onConfirm={() => {
          setIsClearHistoryModalVisible(false);
          hideAllFromContinueWatching();
        }}
        onCancel={() => setIsClearHistoryModalVisible(false)}
        testID="home-clear-history-modal"
      />

      <ConfirmModalGlobal
        visible={Boolean(itemToRemove)}
        title="Remover do Continuar Assistindo"
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
            hideFromContinueWatching(itemToRemove.id, itemToRemove.seriesId);
            setItemToRemove(null);
          }
        }}
        onCancel={() => setItemToRemove(null)}
        testID="home-remove-item-modal"
      />

      <ConfirmModalGlobal
        visible={syncModal.visible}
        title={syncModal.title}
        description={syncModal.description}
        confirmText="OK"
        showCancel={false}
        variant={syncModal.success ? 'success' : 'danger'}
        iconName={syncModal.success ? 'sync' : 'error-outline'}
        onConfirm={() => setSyncModal((prev) => ({ ...prev, visible: false }))}
        onCancel={() => setSyncModal((prev) => ({ ...prev, visible: false }))}
        testID="home-sync-modal"
      />
    </Container>
  );
};

