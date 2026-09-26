export interface IPosterCardGlobalProps {
  title: string;
  posterUrl?: string;
  onPress: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  rating?: string;
  percentage?: number;
  /** Mostra o coração no canto do pôster */
  isFavorite?: boolean;
  width?: number;
  testID?: string;
}
