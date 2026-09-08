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
  const containerRef = React.useRef<any>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setTrackWidth(w);
    }
  }, []);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (!onSeek) return;

      const native = e.nativeEvent as any;
      if (typeof window !== 'undefined' && containerRef.current?.getBoundingClientRect) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = native.clientX ?? native.pageX;
        if (typeof clientX === 'number' && rect && rect.width > 0) {
          const x = clientX - rect.left;
          const clampedPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          onSeek(clampedPct);
          return;
        }
      }

      if (trackWidth > 0) {
        const x = native.locationX ?? 0;
        const clampedPct = Math.max(0, Math.min(100, (x / trackWidth) * 100));
        onSeek(clampedPct);
      }
    },
    [onSeek, trackWidth]
  );

  const isInteractive = interactive || !!onSeek;

  return (
    <TouchContainer
      ref={containerRef}
      interactive={isInteractive}
      testID={testID}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => isInteractive}
      onMoveShouldSetResponder={() => isInteractive}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <ProgressTrack height={height} pointerEvents="none">
        <ProgressFill percentage={percentage} testID="progress-fill" pointerEvents="none" />
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

