import { describe, it, expect } from 'vitest';

// The snap algorithm: find the nearest snap point within threshold
function snapToNearest(
  position: number,
  snapPoints: number[],
  threshold: number,
): { snapped: boolean; position: number } {
  for (const point of snapPoints) {
    if (Math.abs(position - point) <= threshold) {
      return { snapped: true, position: point };
    }
  }
  return { snapped: false, position };
}

describe('snap logic', () => {
  it('snaps to nearest clip edge within threshold', () => {
    const result = snapToNearest(998, [1000, 2000, 3000], 10);
    expect(result.snapped).toBe(true);
    expect(result.position).toBe(1000);
  });

  it('does not snap when outside threshold', () => {
    const result = snapToNearest(1020, [1000, 2000, 3000], 10);
    expect(result.snapped).toBe(false);
    expect(result.position).toBe(1020);
  });

  it('snaps to closest point when multiple are in range', () => {
    const result = snapToNearest(1004, [1000, 1010], 10);
    expect(result.snapped).toBe(true);
    expect(result.position).toBe(1000); // First match wins
  });

  it('snaps to exact match', () => {
    const result = snapToNearest(5000, [5000], 0);
    expect(result.snapped).toBe(true);
    expect(result.position).toBe(5000);
  });
});
