import type { TextDocument, ThermalLayout } from '../types';
import { padText, wrapWords } from '../utils/format';

export function buildTextLayout(document: TextDocument): ThermalLayout {
  const width = document.charsPerLine;
  const lines: ThermalLayout['lines'] = [];

  if (document.title.trim()) {
    lines.push({
      text: padText(document.title.toUpperCase(), width, document.alignment),
      bold: true,
      scale: document.scale
    });
    lines.push({ text: '' });
  }

  const paragraphs = document.content.split('\n');
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push({ text: '' });
      continue;
    }

    const wrapped = wrapWords(paragraph, width);
    wrapped.forEach((segment) => {
      lines.push({
        text: padText(segment, width, document.alignment),
        bold: document.bold,
        scale: document.scale
      });
    });
  }

  return {
    widthChars: width,
    lines
  };
}
