import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export const useAppUpdates = () => {
  useEffect(() => {
    const checkForUpdates = async () => {
      if (__DEV__) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('[Updates] Erro ao buscar atualizações OTA:', error);
      }
    };

    checkForUpdates();
  }, []);
};
