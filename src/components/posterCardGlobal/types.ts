export interface IPosterCardGlobalProps {
  title: string;
  posterUrl?: string;
  onPress: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  rating?: string;
  percentage?: number;
  width?: number;
  testID?: string;
}
