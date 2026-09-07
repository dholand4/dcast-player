import styled from 'styled-components/native';

interface ITrackProps {
  height: number;
}

interface IFillProps {
  percentage: number;
}

interface IThumbProps {
  percentage: number;
  height: number;
}

export const TouchContainer = styled.View<{ interactive?: boolean }>`
  width: 100%;
  padding-vertical: ${({ interactive }) => (interactive ? 10 : 0)}px;
  justify-content: center;
  position: relative;
`;

export const ProgressTrack = styled.View<ITrackProps>`
  width: 100%;
  height: ${({ height }) => height}px;
  background-color: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: ${({ theme }) => theme.radii.xs}px;
  overflow: hidden;
`;

export const ProgressFill = styled.View<IFillProps>`
  width: ${({ percentage }) => Math.min(100, Math.max(0, percentage))}%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.xs}px;
`;

export const ScrubberThumb = styled.View<IThumbProps>`
  position: absolute;
  left: ${({ percentage }) => Math.min(100, Math.max(0, percentage))}%;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-width: 2px;
  border-color: ${({ theme }) => theme.colors.white};
  margin-left: -7px;
  top: ${({ height }) => 10 + height / 2 - 7}px;
  elevation: 3;
`;

