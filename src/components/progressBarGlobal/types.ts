export interface IProgressBarGlobalProps {
  percentage: number;
  height?: number;
  interactive?: boolean;
  onSeek?: (percentage: number) => void;
  testID?: string;
}

