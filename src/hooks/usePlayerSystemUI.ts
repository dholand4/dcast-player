import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { setStatusBarHidden } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { enterWebFullscreen, exitWebFullscreen, isTouchOnlyWebDevice } from '../utils/webFullscreen';

interface IUsePlayerSystemUIParams {
  isCasting: boolean;
  showControls: boolean;
  navigation?: { setOptions?: (options: Record<string, unknown>) => void };
}

/**
 * Na reprodução local: trava em paisagem e esconde a barra de status e a barra de
 * navegação do Android. Ao transmitir ou sair do player, restaura tudo.
 * No celular/tablet pela Web (PWA no iPad), entra em tela cheia para sumir a barra de status.
 */
export function usePlayerSystemUI({ isCasting, showControls, navigation }: IUsePlayerSystemUIParams) {
  useEffect(() => {
    if (Platform.OS !== 'web' || isCasting || !isTouchOnlyWebDevice()) return;

    // O navegador só libera a tela cheia logo após um toque: tenta ao abrir (ainda vale o
    // toque em "Assistir") e, se não der, no primeiro toque dentro do player
    enterWebFullscreen();
    const onFirstTouch = () => {
      enterWebFullscreen();
      document.removeEventListener('touchend', onFirstTouch, true);
      document.removeEventListener('click', onFirstTouch, true);
    };
    document.addEventListener('touchend', onFirstTouch, true);
    document.addEventListener('click', onFirstTouch, true);

    return () => {
      document.removeEventListener('touchend', onFirstTouch, true);
      document.removeEventListener('click', onFirstTouch, true);
      exitWebFullscreen();
    };
  }, [isCasting]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function applyOrientationAndStatusBar() {
      try {
        if (!isCasting) {
          RNStatusBar.setHidden(true, 'fade');
          setStatusBarHidden(true, 'fade');
          navigation?.setOptions?.({
            statusBarHidden: true,
            statusBarAnimation: 'fade',
          });
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

          // Oculta a barra de navegação virtual do Android (botões Voltar, Home, Recents)
          if (Platform.OS === 'android') {
            // Com edge-to-edge, a barra oculta reaparece temporariamente ao deslizar da borda
            await NavigationBar.setVisibilityAsync('hidden').catch(() => {});
          }
        } else {
          RNStatusBar.setHidden(false, 'fade');
          setStatusBarHidden(false, 'fade');
          navigation?.setOptions?.({
            statusBarHidden: false,
            statusBarAnimation: 'fade',
          });
          if (Platform.isTV) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          } else {
            await ScreenOrientation.unlockAsync();
          }
        }
      } catch {
        // ignore on unsupported environments
      }
    }
    applyOrientationAndStatusBar();

    return () => {
      if (Platform.isTV) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
      } else {
        ScreenOrientation.unlockAsync().catch(() => {});
      }
      RNStatusBar.setHidden(false, 'fade');
      setStatusBarHidden(false, 'fade');
      navigation?.setOptions?.({
        statusBarHidden: false,
      });
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible').catch(() => {});
      }
    };
  }, [isCasting, navigation]);

  // Sincroniza a visibilidade da barra de navegação virtual do Android com o sumiço dos controles
  useEffect(() => {
    if (Platform.OS === 'android' && !isCasting && !showControls) {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    }
  }, [showControls, isCasting]);

}
