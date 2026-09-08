import { IAccountCredentials } from '../../@types/xtream';

export interface INetworkDiagnosticModalProps {
  visible: boolean;
  onClose: () => void;
  account: IAccountCredentials | null;
}
