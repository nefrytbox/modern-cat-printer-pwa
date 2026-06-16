import { resolvePrintSettings } from './qualityPresets';

describe('quality presets', () => {
  it('merges overrides without losing base preset margins', () => {
    const resolved = resolvePrintSettings('regular-58', {
      threshold: 140,
      margins: { top: 6, right: 10, bottom: 12, left: 8 }
    });

    expect(resolved.threshold).toBe(140);
    expect(resolved.margins.top).toBe(6);
    expect(resolved.margins.left).toBe(8);
    expect(resolved.label).toBe('58 mm Regular Paper');
  });
});
