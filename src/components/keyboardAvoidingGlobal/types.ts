import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export interface IKeyboardAvoidingGlobalProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
