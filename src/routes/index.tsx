import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
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
      {account ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

