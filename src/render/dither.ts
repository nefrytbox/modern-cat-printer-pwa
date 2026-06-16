import type { DitheringMethod } from '../types';
import { clamp } from '../utils/format';

function applyGamma(value: number, gamma: number): number {
  const normalized = clamp(value / 255, 0, 1);
  return Math.pow(normalized, 1 / gamma) * 255;
}

function applyContrast(value: number, contrast: number): number {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return clamp(factor * (value - 128) + 128, 0, 255);
}

function toLuminance(data: Uint8ClampedArray, contrast: number, gamma: number): number[] {
  const values: number[] = [];

  for (let index = 0; index < data.length; index += 4) {
    const luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    values.push(applyContrast(applyGamma(luminance, gamma), contrast));
  }

  return values;
}

function applyThreshold(values: number[], threshold: number): number[] {
  return values.map((value) => (value < threshold ? 0 : 255));
}

function applyOrdered(values: number[], width: number, threshold: number): number[] {
  const matrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  return values.map((value, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const bias = (matrix[y % 4][x % 4] / 16) * 32 - 16;
    return value < threshold + bias ? 0 : 255;
  });
}

function applyFloydSteinberg(values: number[], width: number, height: number, threshold: number): number[] {
  const result = [...values];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldPixel = result[index];
      const nextPixel = oldPixel < threshold ? 0 : 255;
      result[index] = nextPixel;
      const error = oldPixel - nextPixel;

      if (x + 1 < width) {
        result[index + 1] += (error * 7) / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          result[index + width - 1] += (error * 3) / 16;
        }
        result[index + width] += (error * 5) / 16;
        if (x + 1 < width) {
          result[index + width + 1] += error / 16;
        }
      }
    }
  }

  return result.map((value) => (value < threshold ? 0 : 255));
}

export function createThermalPreview(
  sourceCanvas: HTMLCanvasElement,
  settings: {
    contrast: number;
    gamma: number;
    threshold: number;
    dithering: DitheringMethod;
  }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const sourceContext = sourceCanvas.getContext('2d');
  const context = canvas.getContext('2d');
  if (!sourceContext || !context) {
    return sourceCanvas;
  }

  const image = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const luminance = toLuminance(image.data, settings.contrast, settings.gamma);
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  let monochrome: number[];
  if (settings.dithering === 'ordered') {
    monochrome = applyOrdered(luminance, width, settings.threshold);
  } else if (settings.dithering === 'floyd-steinberg') {
    monochrome = applyFloydSteinberg(luminance, width, height, settings.threshold);
  } else {
    monochrome = applyThreshold(luminance, settings.threshold);
  }

  for (let index = 0; index < monochrome.length; index += 1) {
    const value = monochrome[index];
    const pixel = index * 4;
    image.data[pixel] = value;
    image.data[pixel + 1] = value;
    image.data[pixel + 2] = value;
    image.data[pixel + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  return canvas;
}
