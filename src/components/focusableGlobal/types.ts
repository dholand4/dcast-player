import { ReactNode } from 'react';
import { PressableProps, StyleProp, ViewStyle } from 'react-native';

export interface IFocusableGlobalProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  // Opacidade aplicada enquanto pressionado, igual ao TouchableOpacity
  activeOpacity?: number;
  // Desenha o contorno de foco (TV/teclado). Desligue quando o componente já tem destaque próprio via isFocused
  focusRing?: boolean;
}
