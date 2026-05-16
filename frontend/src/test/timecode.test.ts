import { describe, it, expect } from 'vitest';
import { formatTimecode, formatDuration, msToPs, pxToMs } from '@/utils/timecode';

describe('formatTimecode', () => {
  it('formats 0ms as 00:00:00', () => {
    expect(formatTimecode(0)).toBe('00:00:00');
  });

  it('formats 1000ms (1 second) as 00:01:00', () => {
    expect(formatTimecode(1000)).toBe('00:01:00');
  });

  it('formats 61000ms (1 min 1 sec) as 01:01:00', () => {
    expect(formatTimecode(61000)).toBe('01:01:00');
  });

  it('formats 500ms at 30fps correctly', () => {
    // 500ms = 0.5 seconds, frames = floor(500 % 1000 / (1000/30)) = floor(500/33.33) = 14
    expect(formatTimecode(500, 30)).toBe('00:00:14');
  });

  it('handles large values', () => {
    expect(formatTimecode(3600000)).toBe('60:00:00');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });
});

describe('msToPs / pxToMs', () => {
  it('converts ms to pixels correctly', () => {
    expect(msToPs(1000, 0.1)).toBe(100);
  });

  it('converts pixels back to ms', () => {
    expect(pxToMs(100, 0.1)).toBe(1000);
  });

  it('round-trips correctly', () => {
    const original = 5500;
    const zoom = 0.15;
    expect(pxToMs(msToPs(original, zoom), zoom)).toBeCloseTo(original);
  });
});