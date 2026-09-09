import React, { useState, useMemo, useCallback } from 'react';
import { View, Platform, Alert, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { useWatchHistory } from '../../hooks/useWatchHistory';
import { clearXtreamCache } from '../../hooks/useXtream';
import { storageService } from '../../services/storageService';
import { HeaderGlobal } from '../../components/headerGlobal';
import { MainNavCardsGlobal } from '../../components/mainNavCardsGlobal';
import { SectionCarouselGlobal } from '../../components/sectionCarouselGlobal';
import { PosterCardGlobal } from '../../components/posterCardGlobal';
import { NetworkDiagnosticModal } from '../../components/networkDiagnosticModal';
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
  const { account, userInfo } = useAuth();
  const { continueWatching, removeProgress, clearHistory } = useWatchHistory();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
    const doClear = () => {
      clearHistory();
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm('Deseja limpar todo o histórico de Continuar Assistindo?')
      ) {
        doClear();
      }
    } else {
      Alert.alert(
        'Limpar Histórico',
        'Deseja limpar todo o histórico de Continuar Assistindo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Limpar Tudo', style: 'destructive', onPress: doClear },
        ]
      );
    }
  }, [clearHistory]);

  const handleConfirmRemoveItem = useCallback(
    (item: { id: string; seriesId?: string; title: string }) => {
      const doRemove = () => {
        removeProgress(item.id, item.seriesId);
      };

      if (Platform.OS === 'web') {
        if (
          typeof window !== 'undefined' &&
          window.confirm(`Deseja remover "${item.title}" do Continuar Assistindo?`)
        ) {
          doRemove();
        }
      } else {
        Alert.alert(
          'Remover Conteúdo',
          `Deseja remover "${item.title}" do Continuar Assistindo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: doRemove },
          ]
        );
      }
    },
    [removeProgress]
  );

  const handleSyncCatalog = useCallback(() => {
    setIsSyncing(true);
    try {
      clearXtreamCache();
      storageService.clearCatalogCache();

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert('Catálogo sincronizado com sucesso! As listas foram atualizadas.');
        }
      } else {
        Alert.alert(
          'Sincronização Concluída',
          'O catálogo de canais, filmes e séries foi atualizado com sucesso.'
        );
      }
    } catch {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert('Erro ao sincronizar catálogo.');
        }
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o catálogo.');
      }
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
            onPress={handleSyncCatalog}
            disabled={isSyncing}
            accessibilityRole="button"
            accessibilityLabel="Atualizar listas de canais e filmes"
            testID="sync-catalog-button"
            style={{ opacity: isSyncing ? 0.6 : 1 }}
          >
            <MaterialIcons
              name={isSyncing ? 'hourglass-empty' : 'sync'}
              size={18}
              color="#29B6F6"
            />
            <QuickActionText>
              {isSyncing ? 'Sincronizando...' : 'Atualizar Listas'}
            </QuickActionText>
          </QuickActionButton>

          <QuickActionButton
            onPress={() => setIsDiagnosticOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Diagnóstico e velocidade da conexão"
            testID="network-diagnostic-button"
          >
            <MaterialIcons name="speed" size={18} color="#46D369" />
            <QuickActionText>Teste de Conexão</QuickActionText>
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
    </Container>
  );
};

