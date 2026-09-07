import React from 'react';
import { View, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.root}>
      <AppProviders>
        <StatusBar style="light" />
        <Routes />
      </AppProviders>
    </View>
  );
}


