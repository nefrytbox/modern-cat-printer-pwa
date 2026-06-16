import { buildTodoLayout } from './todo';
import type { TodoDocument } from '../types';

const fixture: TodoDocument = {
  title: 'Packing list',
  includeDate: false,
  noteLines: 2,
  templateName: 'Packing',
  sections: [
    {
      id: 'section-1',
      title: 'Travel',
      items: [
        { id: 'item-1', text: 'Passport', checked: false, priority: 'high' },
        { id: 'item-2', text: 'Toothbrush', checked: true, priority: 'low' }
      ]
    }
  ]
};

describe('todo layout', () => {
  it('renders printable checkbox lines and notes section', () => {
    const layout = buildTodoLayout(fixture, 36);
    const lines = layout.lines.map((line) => line.text);

    expect(lines.some((line) => line.includes('[ ] Passport'))).toBe(true);
    expect(lines.some((line) => line.includes('[x] Toothbrush'))).toBe(true);
    expect(lines.some((line) => line.includes('NOTES'))).toBe(true);
    expect(lines.filter((line) => line.startsWith('.')).length).toBe(2);
  });
});
