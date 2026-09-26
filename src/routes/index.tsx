import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfiles';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { ProfileStack } from './ProfileStack';
import { navigationRef } from './navigationRef';
import { LoadingGlobal } from '../components/loadingGlobal';

const navDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#121212',
    text: '#FFFFFF',
    border: '#282828',
    primary: '#E50914',
  },
};

export const Routes: React.FC = () => {
  const { account, isLoading } = useAuth();
  const { activeProfile } = useProfiles();

  if (isLoading) {
    return <LoadingGlobal fullscreen message="Iniciando DCast Player..." />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navDarkTheme}
      documentTitle={{
        enabled: true,
        formatter: () => 'DCast Player',
      }}
    >
      {!account ? (
        <AuthStack />
      ) : !activeProfile ? (
        <ProfileStack />
      ) : (
        // A key recria as telas ao trocar de perfil, recarregando histórico e favoritos
        <AppStack key={activeProfile.id} />
      )}
    </NavigationContainer>
  );
};

