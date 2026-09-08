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

      // Previne que tags de vídeo HTML5 estufem a página com zoom no Web
      let styleTag = document.getElementById('dcast-web-video-reset') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dcast-web-video-reset';
        styleTag.textContent = `
          video {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain;
            background-color: #000000;
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            contain: strict;
          }
        `;
        document.head.appendChild(styleTag);
      }

      // Injeta Hls.js para suporte a canais de TV ao vivo no navegador
      let hlsScript = document.getElementById('hls-cdn-script') as HTMLScriptElement | null;
      if (!hlsScript) {
        hlsScript = document.createElement('script');
        hlsScript.id = 'hls-cdn-script';
        hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
        document.head.appendChild(hlsScript);
      }
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


