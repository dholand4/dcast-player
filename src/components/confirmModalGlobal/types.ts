import { MaterialIcons } from '@expo/vector-icons';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'primary' | 'success';

export interface IConfirmModalGlobalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: ConfirmModalVariant;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}
