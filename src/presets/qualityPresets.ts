import type { PrintQualityPreset, PrintSettingsOverride } from '../types';

export const QUALITY_PRESETS: PrintQualityPreset[] = [
  {
    id: 'regular-58',
    label: '58 mm Regular Paper',
    paperWidthMm: 58,
    printWidthPx: 384,
    charsPerLine: 36,
    dithering: 'threshold',
    threshold: 150,
    contrast: 8,
    gamma: 1,
    darkness: 0x5d,
    feedBefore: 8,
    feedAfter: 20,
    chunkDelayMs: 15,
    margins: { top: 16, right: 14, bottom: 16, left: 14 },
    interline: 1.22
  },
  {
    id: 'sticker-58',
    label: '58 mm Sticker Paper',
    paperWidthMm: 58,
    printWidthPx: 384,
    charsPerLine: 36,
    dithering: 'ordered',
    threshold: 144,
    contrast: 14,
    gamma: 0.95,
    darkness: 0x64,
    feedBefore: 10,
    feedAfter: 24,
    chunkDelayMs: 18,
    margins: { top: 18, right: 12, bottom: 18, left: 12 },
    interline: 1.2
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    paperWidthMm: 58,
    printWidthPx: 384,
    charsPerLine: 36,
    dithering: 'floyd-steinberg',
    threshold: 132,
    contrast: 20,
    gamma: 0.9,
    darkness: 0x6a,
    feedBefore: 12,
    feedAfter: 24,
    chunkDelayMs: 18,
    margins: { top: 16, right: 12, bottom: 20, left: 12 },
    interline: 1.18
  },
  {
    id: 'delicate-paper',
    label: 'Delicate Paper',
    paperWidthMm: 58,
    printWidthPx: 384,
    charsPerLine: 42,
    dithering: 'threshold',
    threshold: 165,
    contrast: 4,
    gamma: 1.05,
    darkness: 0x52,
    feedBefore: 8,
    feedAfter: 18,
    chunkDelayMs: 18,
    margins: { top: 16, right: 16, bottom: 16, left: 16 },
    interline: 1.26
  },
  {
    id: 'fast-draft',
    label: 'Fast Draft',
    paperWidthMm: 57,
    printWidthPx: 384,
    charsPerLine: 32,
    dithering: 'ordered',
    threshold: 158,
    contrast: 6,
    gamma: 1,
    darkness: 0x57,
    feedBefore: 6,
    feedAfter: 16,
    chunkDelayMs: 10,
    margins: { top: 14, right: 18, bottom: 14, left: 18 },
    interline: 1.18
  },
  {
    id: 'best-quality',
    label: 'Best Quality',
    paperWidthMm: 58,
    printWidthPx: 384,
    charsPerLine: 36,
    dithering: 'floyd-steinberg',
    threshold: 136,
    contrast: 16,
    gamma: 0.92,
    darkness: 0x70,
    feedBefore: 14,
    feedAfter: 28,
    chunkDelayMs: 22,
    margins: { top: 20, right: 14, bottom: 20, left: 14 },
    interline: 1.28
  }
];

export function getQualityPreset(presetId: string): PrintQualityPreset {
  return QUALITY_PRESETS.find((preset) => preset.id === presetId) ?? QUALITY_PRESETS[0];
}

export function resolvePrintSettings(presetId: string, overrides: PrintSettingsOverride): PrintQualityPreset {
  const base = getQualityPreset(presetId);
  return {
    ...base,
    ...overrides,
    margins: {
      ...base.margins,
      ...overrides.margins
    }
  };
}
