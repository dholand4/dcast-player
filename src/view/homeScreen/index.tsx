import React, { useState, useMemo, useCallback } from 'react';
import { View, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useCast } from '../../hooks/useCast';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { clearXtreamCache } from '../../hooks/useXtream';
import { storageService } from '../../services/storageService';
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
import {
  Container,
  ScrollArea,
  SubscriptionCard,
  SubscriptionInfo,
  SubscriptionText,
  ExpirationBadge,
  ExpirationBadgeText,
  QuickActionsRow,
  QuickActionButton,
  QuickActionText,
} from './style';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { account, userInfo, logout } = useAuth();
  const { isCasting, stopCast } = useCast();
  const { continueWatching, removeProgress, clearHistory } = useWatchHistory();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
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

  const handleExecuteLogout = useCallback(() => {
    if (isCasting) {
      stopCast();
    }
    clearXtreamCache();
    storageService.clearCatalogCache();
    logout();
  }, [isCasting, stopCast, logout]);

  const handleConfirmLogout = useCallback(() => {
    setIsLogoutModalVisible(true);
  }, []);

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

  const handleSyncCatalog = useCallback(() => {
    setIsSyncing(true);
    try {
      clearXtreamCache();
      storageService.clearCatalogCache();

      setSyncModal({
        visible: true,
        success: true,
        title: 'Catálogo Atualizado',
        description:
          'O catálogo de canais, filmes e séries foi atualizado com sucesso.',
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
  }, []);

  return (
    <Container testID="home-screen">
      <HeaderGlobal
        title={account?.label || 'DCast Player'}
        subtitle={account?.username ? `@${account.username}` : undefined}
        extraInfo={formattedExpDate}
        onSearchPress={() => navigation.navigate('SearchScreen')}
      />

      <ScrollArea>
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
            onPress={handleConfirmLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair ou trocar de lista IPTV"
            testID="home-logout-button"
            style={{ borderColor: 'rgba(229, 9, 20, 0.4)' }}
          >
            <MaterialIcons name="logout" size={20} color="#E50914" />
            <QuickActionText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: '#E50914' }}
            >
              Trocar Lista
            </QuickActionText>
          </QuickActionButton>

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
          <View style={{ marginTop: 20, marginBottom: 16 }}>
            <SectionCarouselGlobal
              title="Continuar Assistindo"
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
                      navigation.navigate('DetailsScreen', {
                        id: item.seriesId || item.id,
                        type: 'series',
                        title: cleanSeriesTitle(item.title),
                        posterUrl: item.posterUrl,
                      });
                    } else if (item.type === 'movie') {
                      navigation.navigate('DetailsScreen', {
                        id: item.id,
                        type: 'movie',
                        title: item.title,
                        posterUrl: item.posterUrl,
                      });
                    } else {
                      navigation.navigate('PlayerScreen', {
                        streamUrl: item.streamUrl || '',
                        title: item.title,
                        posterUrl: item.posterUrl,
                        type: 'live',
                        contentId: item.id,
                      });
                    }
                  }}
                  onRemove={() => handleConfirmRemoveItem(item)}
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
        visible={isLogoutModalVisible}
        title="Sair da Lista"
        description={`Deseja sair de "${account?.label || account?.username || 'esta lista'}"? Suas listas continuarão salvas para alternar com facilidade.`}
        confirmText="Sair e Trocar"
        cancelText="Cancelar"
        variant="danger"
        iconName="logout"
        onConfirm={() => {
          setIsLogoutModalVisible(false);
          handleExecuteLogout();
        }}
        onCancel={() => setIsLogoutModalVisible(false)}
        testID="home-logout-modal"
      />

      <ConfirmModalGlobal
        visible={isClearHistoryModalVisible}
        title="Limpar Histórico"
        description="Deseja limpar todo o histórico de Continuar Assistindo? Esta ação não pode ser desfeita."
        confirmText="Apagar Tudo"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-sweep"
        onConfirm={() => {
          setIsClearHistoryModalVisible(false);
          clearHistory();
        }}
        onCancel={() => setIsClearHistoryModalVisible(false)}
        testID="home-clear-history-modal"
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

