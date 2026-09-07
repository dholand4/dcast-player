import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreenProps } from '../../routes/types';
import { useAuth } from '../../hooks/useAuth';
import { HeaderGlobal } from '../../components/headerGlobal';
import { MainNavCardsGlobal } from '../../components/mainNavCardsGlobal';
import { formatExpirationDate } from '../../utils/formatters';
import {
  Container,
  ScrollArea,
  SubscriptionCard,
  SubscriptionInfo,
  SubscriptionText,
  ExpirationBadge,
  ExpirationBadgeText,
} from './style';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { account, userInfo } = useAuth();
  const formattedExpDate = formatExpirationDate(userInfo?.exp_date);

  return (
    <Container testID="home-screen">
      <HeaderGlobal
        title={account?.label || 'DCast Player'}
        subtitle={account?.username ? `@${account.username}` : undefined}
        extraInfo={formattedExpDate}
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
              title: 'Filmes (VOD)',
            })
          }
          onSelectSeries={() =>
            navigation.navigate('CategoryScreen', {
              type: 'series',
              title: 'Séries',
            })
          }
        />
      </ScrollArea>
    </Container>
  );
};

