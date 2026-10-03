import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { theme } from '../constants/theme';
import { navigationRef } from '../routes/navigationRef';

export type AppUpdateStatus = 'idle' | 'downloading' | 'restarting';

// Intervalo mínimo entre buscas ao voltar para o app, para não consultar o servidor a cada troca rápida
const FOREGROUND_CHECK_INTERVAL_MS = 60 * 1000;

export const useAppUpdates = (): AppUpdateStatus => {
  const [status, setStatus] = useState<AppUpdateStatus>('idle');
  const isCheckingRef = useRef(false);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    if (__DEV__) {
      return;
    }

    const checkForUpdates = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      lastCheckRef.current = Date.now();

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setStatus('downloading');
          await Updates.fetchUpdateAsync();
          setStatus('restarting');
          // Tela nativa exibida durante o reload, no lugar do flash branco
          await Updates.reloadAsync({
            reloadScreenOptions: {
              backgroundColor: theme.colors.background,
              spinner: { enabled: true, color: theme.colors.primary, size: 'large' },
            },
          });
        }
      } catch (error) {
        console.log('[Updates] Erro ao buscar atualizações OTA:', error);
        setStatus('idle');
      } finally {
        isCheckingRef.current = false;
      }
    };

    checkForUpdates();

    if (Platform.OS === 'web') {
      return;
    }

    // Na TV o botão Voltar/Home só manda o app para segundo plano, então ele quase nunca
    // abre do zero. Busca de novo quando o app volta para a tela.
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (Date.now() - lastCheckRef.current < FOREGROUND_CHECK_INTERVAL_MS) return;
      // Não recarrega no meio de um vídeo (ex.: voltando da janelinha flutuante)
      if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name === 'PlayerScreen') return;
      checkForUpdates();
    });

    return () => subscription.remove();
  }, []);

  return status;
};
