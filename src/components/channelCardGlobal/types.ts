export interface IChannelCardGlobalProps {
  name: string;
  logoUrl?: string;
  channelNumber?: number | string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlay: () => void;
  testID?: string;
}
