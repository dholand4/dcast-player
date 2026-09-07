import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

export function useAppInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  const top =
    Platform.OS === 'android'
      ? Math.max(insets.top, RNStatusBar.currentHeight ?? 0)
      : insets.top;

  return {
    ...insets,
    top,
  };
}
