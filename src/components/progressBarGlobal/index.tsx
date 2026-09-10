import React, { useState, useCallback } from 'react';
import { LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { IProgressBarGlobalProps } from './types';
import { TouchContainer, ProgressTrack, ProgressFill, ScrubberThumb } from './style';

export const ProgressBarGlobal: React.FC<IProgressBarGlobalProps> = ({
  percentage,
  height = 4,
  interactive = false,
  onSeek,
  onHover,
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

  const getPercentageFromEvent = useCallback(
    (e: any): { clampedPct: number; clientX: number; width: number } => {
      const native = e.nativeEvent || e;
      if (typeof window !== 'undefined' && containerRef.current?.getBoundingClientRect) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = native.clientX ?? native.pageX ?? 0;
        if (rect && rect.width > 0) {
          const x = clientX - rect.left;
          const clampedPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          return { clampedPct, clientX: x, width: rect.width };
        }
      }

      const w = trackWidth > 0 ? trackWidth : 1;
      const x = native.locationX ?? native.layerX ?? 0;
      const clampedPct = Math.max(0, Math.min(100, (x / w) * 100));
      return { clampedPct, clientX: x, width: w };
    },
    [trackWidth]
  );

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (!onSeek) return;
      const { clampedPct } = getPercentageFromEvent(e);
      onSeek(clampedPct);
    },
    [onSeek, getPercentageFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!onHover) return;
      const { clampedPct, clientX, width } = getPercentageFromEvent(e);
      onHover({
        percentage: clampedPct,
        clientX,
        trackWidth: width,
      });
    },
    [onHover, getPercentageFromEvent]
  );

  const handlePointerLeave = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  const isInteractive = interactive || !!onSeek;

  return (
    <TouchContainer
      ref={containerRef}
      interactive={isInteractive}
      testID={testID}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => isInteractive}
      onMoveShouldSetResponder={() => isInteractive}
      onResponderGrant={(e) => {
        handleTouch(e);
        handlePointerMove(e);
      }}
      onResponderMove={(e) => {
        handleTouch(e);
        handlePointerMove(e);
      }}
      onResponderRelease={handlePointerLeave}
      onResponderTerminate={handlePointerLeave}
      {...({
        onPointerMove: handlePointerMove,
        onPointerLeave: handlePointerLeave,
        onMouseMove: handlePointerMove,
        onMouseLeave: handlePointerLeave,
      } as any)}
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

