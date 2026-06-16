import type { ThermalLayout, TodoDocument, TodoPriority } from '../types';
import { formatDateTime, padText, wrapWords } from '../utils/format';

function priorityMarker(priority: TodoPriority): string {
  if (priority === 'high') {
    return '!!';
  }
  if (priority === 'medium') {
    return '!';
  }
  return '-';
}

export function buildTodoLayout(document: TodoDocument, width = 36): ThermalLayout {
  const lines: ThermalLayout['lines'] = [];
  const divider = '-'.repeat(width);

  lines.push({ text: padText(document.title.toUpperCase(), width, 'center'), bold: true });
  if (document.includeDate) {
    lines.push({ text: padText(formatDateTime(), width, 'center') });
  }
  lines.push({ text: divider });

  for (const section of document.sections) {
    if (section.title.trim()) {
      lines.push({ text: section.title.toUpperCase(), bold: true });
    }

    for (const item of section.items) {
      const prefix = `${priorityMarker(item.priority)} ${item.checked ? '[x]' : '[ ]'} `;
      const wrapped = wrapWords(item.text, Math.max(6, width - prefix.length));
      wrapped.forEach((segment, index) => {
        lines.push({ text: `${index === 0 ? prefix : ' '.repeat(prefix.length)}${segment}` });
      });
    }

    lines.push({ text: '' });
  }

  if (document.noteLines > 0) {
    lines.push({ text: divider });
    lines.push({ text: 'NOTES' });
    for (let index = 0; index < document.noteLines; index += 1) {
      lines.push({ text: '.'.repeat(width) });
    }
  }

  return {
    widthChars: width,
    lines
  };
}
