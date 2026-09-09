import { ContentType, ICustomCategoryFolder } from '../../@types/storage';
import { IXtreamLiveStream, IXtreamVodStream, IXtreamSeries } from '../../@types/xtream';

export interface ICustomFolderEditModalGlobalProps {
  visible: boolean;
  onClose: () => void;
  type: ContentType;
  folderToEdit?: ICustomCategoryFolder | null;
  availableStreams: (IXtreamLiveStream | IXtreamVodStream | IXtreamSeries)[];
  onSave: (folder: ICustomCategoryFolder) => void;
}
