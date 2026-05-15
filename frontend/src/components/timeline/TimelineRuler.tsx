interface Props {
  totalDurationMs: number;
  zoomLevel: number;
  scrollPosition: number;
  height: number;
}

export default function TimelineRuler({ totalDurationMs, zoomLevel, scrollPosition, height }: Props) {
  const pxPerSec = zoomLevel * 1000;

  // Choose tick interval based on zoom
  let majorInterval = 10000; // every 10 seconds
  if (pxPerSec > 200) majorInterval = 1000;
  else if (pxPerSec > 50) majorInterval = 5000;
  else if (pxPerSec < 5) majorInterval = 60000;

  const minorInterval = majorInterval / 5;

  const ticks: Array<{ ms: number; major: boolean }> = [];
  for (let ms = 0; ms <= totalDurationMs; ms += minorInterval) {
    ticks.push({ ms, major: ms % majorInterval === 0 });
  }

  return (
    <svg
      style={{ width: totalDurationMs * zoomLevel, height }}
      className="absolute left-0 top-0"
    >
      {ticks.map(({ ms, major }) => {
        const x = ms * zoomLevel;
        return (
          <g key={ms}>
            <line
              x1={x} y1={major ? 0 : height / 2}
              x2={x} y2={height}
              stroke="hsl(var(--border))"
              strokeWidth={major ? 1 : 0.5}
            />
            {major && (
              <text
                x={x + 3}
                y={height - 6}
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
                fontFamily="monospace"
              >
                {ms >= 60000
                  ? `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`
                  : `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
