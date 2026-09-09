import { IEpgListing } from '../../@types/xtream';

export interface IEpgModalGlobalProps {
  visible: boolean;
  onClose: () => void;
  channelName: string;
  channelLogo?: string;
  channelNumber?: number;
  streamId?: string;
  initialEpgList?: IEpgListing[];
}
