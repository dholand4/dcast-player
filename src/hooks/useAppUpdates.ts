import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { theme } from '../constants/theme';

export type AppUpdateStatus = 'idle' | 'downloading' | 'restarting';

export const useAppUpdates = (): AppUpdateStatus => {
  const [status, setStatus] = useState<AppUpdateStatus>('idle');

  useEffect(() => {
    const checkForUpdates = async () => {
      if (__DEV__) {
        return;
      }

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
      }
    };

    checkForUpdates();
  }, []);

  return status;
};
