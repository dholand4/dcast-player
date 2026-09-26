import { Platform, ToastAndroid } from 'react-native';

/** Aviso rápido na parte de baixo da tela (Android). Em outras plataformas o próprio visual já indica a mudança. */
export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}
