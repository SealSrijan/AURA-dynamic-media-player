import React, { useEffect, useState } from 'react';

interface EqualizerProps {
  isPlaying: boolean;
  accentHex?: string;
  barCount?: number;
  reducedMotion?: boolean;
}

export const Equalizer: React.FC<EqualizerProps> = ({
  isPlaying,
  accentHex = '#F59E0B',
  barCount = 14,
  reducedMotion = false,
}) => {
  // Waveform heights
  const [heights, setHeights] = useState<number[]>(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Symmetrical gaussian curve peak in the center
      const center = (barCount - 1) / 2;
      const dist = Math.abs(i - center) / center;
      return Math.max(0.2, 1 - dist * 0.7);
    });
  });

  useEffect(() => {
    if (!isPlaying || reducedMotion) {
      // Idle state
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const center = (barCount - 1) / 2;
          const dist = Math.abs(i - center) / center;
          return Math.max(0.15, (1 - dist * 0.7) * 0.35);
        })
      );
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const center = (barCount - 1) / 2;
          const dist = Math.abs(i - center) / center;
          const base = Math.max(0.25, 1 - dist * 0.65);
          // Organic flutter variation
          const jitter = (Math.random() - 0.45) * 0.65;
          return Math.min(1, Math.max(0.15, base + jitter));
        })
      );
    }, 110);

    return () => clearInterval(interval);
  }, [isPlaying, barCount, reducedMotion]);

  return (
    <div className="flex items-center justify-center gap-[2.5px] h-7 px-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-150 ease-out"
          style={{
            height: `${Math.round(h * 24)}px`,
            backgroundColor: accentHex,
            boxShadow: isPlaying ? `0 0 6px ${accentHex}99` : 'none',
            opacity: isPlaying ? 0.95 : 0.4,
          }}
        />
      ))}
    </div>
  );
};
