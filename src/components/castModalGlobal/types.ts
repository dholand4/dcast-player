export interface ICastModalGlobalProps {
  visible: boolean;
  onClose: () => void;
  isCasting: boolean;
  currentMediaTitle?: string;
  onDisconnect?: () => void;
  onOpenNativePicker?: () => void;
  testID?: string;
}
