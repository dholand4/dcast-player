import { INewEpisodeItem } from '../../hooks/useNewEpisodes';

export interface INewEpisodesModalGlobalProps {
  visible: boolean;
  items: INewEpisodeItem[];
  onClose: () => void;
  onSelect: (item: INewEpisodeItem) => void;
  onDismiss: (item: INewEpisodeItem) => void;
  testID?: string;
}
