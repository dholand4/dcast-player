export interface IProgressBarHoverData {
  percentage: number;
  clientX: number;
  trackWidth: number;
}

export interface IProgressBarGlobalProps {
  percentage: number;
  height?: number;
  interactive?: boolean;
  onSeek?: (percentage: number) => void;
  onHover?: (data: IProgressBarHoverData | null) => void;
  testID?: string;
}

