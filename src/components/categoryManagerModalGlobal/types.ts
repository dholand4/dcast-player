import { ContentType } from '../../@types/storage';
import { IXtreamCategory, IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';

export interface ICategoryManagerModalGlobalProps {
  visible: boolean;
  onClose: () => void;
  type: ContentType;
  categories: IXtreamCategory[];
  availableStreams: (IXtreamLiveStream | IXtreamVodStream | IXtreamSeries)[];
}

export type CategoryManagerTab = 'server' | 'custom' | 'streams';
