import React, { useState, useCallback } from 'react';
import { LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { IProgressBarGlobalProps } from './types';
import { TouchContainer, ProgressTrack, ProgressFill, ScrubberThumb } from './style';

export const ProgressBarGlobal: React.FC<IProgressBarGlobalProps> = ({
  percentage,
  height = 4,
  interactive = false,
  onSeek,
  testID,
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setTrackWidth(w);
    }
  }, []);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (!onSeek || trackWidth <= 0) return;
      const x = e.nativeEvent.locationX;
      const clampedPct = Math.max(0, Math.min(100, (x / trackWidth) * 100));
      onSeek(clampedPct);
    },
    [onSeek, trackWidth]
  );

  const isInteractive = interactive || !!onSeek;

  return (
    <TouchContainer
      interactive={isInteractive}
      testID={testID}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => isInteractive}
      onMoveShouldSetResponder={() => isInteractive}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <ProgressTrack height={height}>
        <ProgressFill percentage={percentage} testID="progress-fill" />
      </ProgressTrack>
      {isInteractive && (
        <ScrubberThumb
          percentage={percentage}
          height={height}
          testID="scrubber-thumb"
          pointerEvents="none"
        />
      )}
    </TouchContainer>
  );
};

