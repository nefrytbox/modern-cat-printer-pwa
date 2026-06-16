import type { TextAlignment } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

export function formatDateTime(date = new Date()): string {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export function safeNumber(value: number | string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function padText(text: string, width: number, alignment: TextAlignment): string {
  if (text.length >= width) {
    return text.slice(0, width);
  }

  if (alignment === 'right') {
    return `${' '.repeat(width - text.length)}${text}`;
  }

  if (alignment === 'center') {
    const total = width - text.length;
    const left = Math.floor(total / 2);
    const right = total - left;
    return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
  }

  return `${text}${' '.repeat(width - text.length)}`;
}

export function joinLabelValue(label: string, value: string, width: number): string {
  if (label.length + value.length >= width) {
    const trimmedLabel = label.slice(0, Math.max(0, width - value.length - 1));
    return `${trimmedLabel} ${value}`.slice(0, width);
  }

  return `${label}${' '.repeat(width - label.length - value.length)}${value}`;
}

export function wrapWords(text: string, width: number): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [''];
  }

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }

      let chunkStart = 0;
      while (chunkStart < word.length) {
        lines.push(word.slice(chunkStart, chunkStart + width));
        chunkStart += width;
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}
