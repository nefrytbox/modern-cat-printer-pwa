import { buildReceiptLayout } from '../documents/receiptPl';
import { buildTextLayout } from '../documents/textDocument';
import { buildTodoLayout } from '../documents/todo';
import type {
  ImageDocument,
  PrintQualityPreset,
  ReceiptPlDocument,
  SavedProject,
  TextDocument,
  ThermalLayout,
  TodoDocument
} from '../types';
import { clamp } from '../utils/format';
import { createThermalPreview } from './dither';

const PREVIEW_FONT_STACK = '"SF Mono", "Roboto Mono", "Fira Mono", ui-monospace, Menlo, monospace';

export async function renderProjectToCanvas(project: SavedProject, settings: PrintQualityPreset): Promise<HTMLCanvasElement> {
  const baseCanvas =
    project.mode === 'image'
      ? await renderImageDocument(project.document as ImageDocument, settings)
      : renderTextMode(project, settings);

  return createThermalPreview(baseCanvas, settings);
}

function renderTextMode(project: SavedProject, settings: PrintQualityPreset): HTMLCanvasElement {
  const layout =
    project.mode === 'receipt-pl'
      ? buildReceiptLayout(project.document as ReceiptPlDocument)
      : project.mode === 'todo'
        ? buildTodoLayout(project.document as TodoDocument, settings.charsPerLine)
        : buildTextLayout(project.document as TextDocument);

  return drawThermalLayout(layout, settings);
}

function drawThermalLayout(layout: ThermalLayout, settings: PrintQualityPreset): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const contentWidth = settings.printWidthPx - settings.margins.left - settings.margins.right;
  const baseFontSize = clamp(Math.floor((contentWidth / layout.widthChars) * 1.8), 13, 22);

  const lineMetrics = layout.lines.map((line) => {
    const scale = line.scale ?? 1;
    const fontSize = Math.max(13, Math.floor(baseFontSize * scale));
    const lineHeight = Math.max(fontSize + 2, fontSize * settings.interline);
    return { fontSize, lineHeight };
  });

  const totalHeight =
    settings.feedBefore +
    settings.feedAfter +
    settings.margins.top +
    settings.margins.bottom +
    lineMetrics.reduce((sum, metric) => sum + metric.lineHeight, 0);

  canvas.width = settings.printWidthPx;
  canvas.height = Math.ceil(totalHeight);

  if (!context) {
    return canvas;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000000';
  context.textBaseline = 'top';
  context.imageSmoothingEnabled = false;

  let y = settings.feedBefore + settings.margins.top;
  layout.lines.forEach((line, index) => {
    const { fontSize, lineHeight } = lineMetrics[index];
    context.font = `${line.bold ? '700' : '500'} ${fontSize}px ${PREVIEW_FONT_STACK}`;
    context.textAlign = 'left';
    context.fillText(line.text, settings.margins.left, y);
    if (line.bold) {
      context.fillText(line.text, settings.margins.left + 0.8, y);
    }
    y += lineHeight;
  });

  return canvas;
}

async function renderImageDocument(document: ImageDocument, settings: PrintQualityPreset): Promise<HTMLCanvasElement> {
  const canvas = globalThis.document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = settings.printWidthPx;

  const contentWidth = settings.printWidthPx - settings.margins.left - settings.margins.right;
  const targetWidth = clamp(document.width, 64, contentWidth);

  if (!context) {
    canvas.height = 240;
    return canvas;
  }

  if (!document.imageDataUrl) {
    canvas.height = 260;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111111';
    context.font = `600 18px ${PREVIEW_FONT_STACK}`;
    context.fillText('No image loaded yet.', settings.margins.left, settings.feedBefore + settings.margins.top + 16);
    context.font = `500 14px ${PREVIEW_FONT_STACK}`;
    context.fillText('Upload a PNG or JPG to preview bitmap printing.', settings.margins.left, settings.feedBefore + settings.margins.top + 42);
    return canvas;
  }

  const image = await loadImage(document.imageDataUrl);
  const rotation = document.rotation;
  const rotated = rotation === 90 || rotation === 270;
  const sourceWidth = rotated ? image.height : image.width;
  const sourceHeight = rotated ? image.width : image.height;
  const scale = document.autoscale ? targetWidth / sourceWidth : Math.min(1, targetWidth / sourceWidth);
  const drawWidth = Math.max(32, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(32, Math.round(sourceHeight * scale));
  const paddedHeight = settings.feedBefore + settings.feedAfter + settings.margins.top + settings.margins.bottom + document.padding * 2 + drawHeight;
  const x = settings.margins.left + Math.floor((contentWidth - drawWidth) / 2);
  const y = settings.feedBefore + settings.margins.top + document.padding;

  canvas.height = paddedHeight;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(x + drawWidth / 2, y + drawHeight / 2);
  context.rotate((rotation * Math.PI) / 180);
  if (rotated) {
    context.drawImage(image, -drawHeight / 2, -drawWidth / 2, drawHeight, drawWidth);
  } else {
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  }
  context.restore();

  if (document.invert) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < imageData.data.length; index += 4) {
      imageData.data[index] = 255 - imageData.data[index];
      imageData.data[index + 1] = 255 - imageData.data[index + 1];
      imageData.data[index + 2] = 255 - imageData.data[index + 2];
    }
    context.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = source;
  });
}
