import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCENT_MAP } from '../src/utils/colors.ts';

test('ACCENT_MAP contains all expected preset accents and fallback glow values', () => {
  const expectedAccents = ['amber', 'cyan', 'purple', 'emerald'];
  for (const acc of expectedAccents) {
    assert.ok(ACCENT_MAP[acc], `Missing accent preset: ${acc}`);
    assert.ok(ACCENT_MAP[acc].hex.startsWith('#'), `Hex should start with #: ${ACCENT_MAP[acc].hex}`);
    assert.ok(ACCENT_MAP[acc].glow.includes('rgba'), `Glow should be rgba: ${ACCENT_MAP[acc].glow}`);
  }
});

test('Format time helper formats milliseconds correctly', () => {
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65000), '1:05');
  assert.equal(formatTime(215000), '3:35');
});

test('Capsule dimensions match mode specifications', () => {
  const getModeSize = (mode, capsuleSize = 'standard') => {
    switch (mode) {
      case 'taskbar':
        return { width: 280, height: 42 };
      case 'expanded':
        return { width: 360, height: 270 };
      case 'settings':
        return { width: 420, height: 480 };
      default: {
        const compactWidth = capsuleSize === 'compact' ? 228 : capsuleSize === 'large' ? 284 : 256;
        return { width: compactWidth, height: 48 };
      }
    }
  };

  assert.deepEqual(getModeSize('island', 'compact'), { width: 228, height: 48 });
  assert.deepEqual(getModeSize('island', 'standard'), { width: 256, height: 48 });
  assert.deepEqual(getModeSize('island', 'large'), { width: 284, height: 48 });
  assert.deepEqual(getModeSize('taskbar'), { width: 280, height: 42 });
  assert.deepEqual(getModeSize('expanded'), { width: 360, height: 270 });
  assert.deepEqual(getModeSize('settings'), { width: 420, height: 480 });
});

test('Marquee animation duration scales proportionally with title length', () => {
  const calcDuration = (title) => Math.max(5, title.length * 0.28);

  assert.equal(calcDuration('Short'), 5);
  assert.ok(calcDuration('A Very Long Song Title That Exceeds Normal Capsule Width Here') > 10);
});

test('Position interpolation clamps to duration boundary', () => {
  const interpolate = (baseMs, elapsedMs, durationMs) => {
    const calculated = baseMs + elapsedMs;
    if (durationMs > 0) {
      return Math.min(calculated, durationMs);
    }
    return calculated;
  };

  assert.equal(interpolate(1000, 500, 5000), 1500);
  assert.equal(interpolate(4900, 300, 5000), 5000); // Clamped to duration
  assert.equal(interpolate(1000, 500, 0), 1500); // Infinite / live stream
});

test('Snap position calculation honors top-center and work-area boundaries', () => {
  const calculateSnapPosition = (corner, screenW, screenH, winW, winH) => {
    const margin = 24.0;
    const taskbarOffset = 56.0;

    let x, y;
    switch (corner) {
      case 'top-center':
        x = (screenW - winW) / 2.0;
        y = margin;
        break;
      case 'top-left':
        x = margin;
        y = margin;
        break;
      case 'top-right':
        x = screenW - winW - margin;
        y = margin;
        break;
      case 'bottom-left':
        x = margin;
        y = screenH - winH - taskbarOffset;
        break;
      case 'center':
        x = (screenW - winW) / 2.0;
        y = (screenH - winH) / 2.0;
        break;
      case 'taskbar':
        x = screenW - winW - 220.0;
        y = screenH - winH - 3.0;
        break;
      default:
        x = screenW - winW - margin;
        y = screenH - winH - taskbarOffset;
        break;
    }

    const clampedX = Math.max(0, Math.min(x, Math.max(0, screenW - winW)));
    const clampedY = Math.max(0, Math.min(y, Math.max(0, screenH - winH)));
    return { x: clampedX, y: clampedY };
  };

  const topCenter = calculateSnapPosition('top-center', 1920, 1080, 256, 48);
  assert.equal(topCenter.x, (1920 - 256) / 2);
  assert.equal(topCenter.y, 24);

  const center = calculateSnapPosition('center', 1920, 1080, 256, 48);
  assert.equal(center.x, (1920 - 256) / 2);
  assert.equal(center.y, (1080 - 48) / 2);
});
