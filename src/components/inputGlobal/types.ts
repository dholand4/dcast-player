import { TextInputProps } from 'react-native';

export interface IInputGlobalProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  onPaste?: () => void;
  onClear?: () => void;
  noMargin?: boolean;
  rightAction?: React.ReactNode;
  testID?: string;
}
