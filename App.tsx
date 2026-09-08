import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/providers';
import { Routes } from './src/routes';
import { useAppUpdates } from './src/hooks/useAppUpdates';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
});

export default function App() {
  useAppUpdates();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'DCast Player';
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0]?.appendChild(link);
      }
      link.href = '/favicon.png';
    }
  }, []);

  return (
    <View style={styles.root}>
      <AppProviders>
        <StatusBar style="light" />
        <Routes />
      </AppProviders>
    </View>
  );
}


