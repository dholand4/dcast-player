export interface IHeaderGlobalProps {
  title: string;
  subtitle?: string;
  extraInfo?: string;
  onBack?: () => void;
  onSearchPress?: () => void;
  showCast?: boolean;
  testID?: string;
}

