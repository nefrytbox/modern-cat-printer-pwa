import { QUALITY_PRESETS } from './presets/qualityPresets';
import type {
  DocumentMode,
  ImageDocument,
  ReceiptPlDocument,
  SavedProject,
  TextDocument,
  TodoDocument
} from './types';
import { formatDateTime } from './utils/format';
import { createId } from './utils/id';

export const TODO_TEMPLATES: Record<string, TodoDocument> = {
  shopping: {
    title: 'Shopping',
    includeDate: true,
    noteLines: 2,
    templateName: 'Shopping',
    sections: [
      {
        id: createId('todo-section'),
        title: 'Groceries',
        items: [
          { id: createId('todo-item'), text: 'Milk', checked: false, priority: 'medium' },
          { id: createId('todo-item'), text: 'Bread', checked: false, priority: 'low' },
          { id: createId('todo-item'), text: 'Apples', checked: false, priority: 'low' }
        ]
      }
    ]
  },
  workday: {
    title: 'Workday',
    includeDate: true,
    noteLines: 3,
    templateName: 'Workday',
    sections: [
      {
        id: createId('todo-section'),
        title: 'Focus',
        items: [
          { id: createId('todo-item'), text: 'Review priorities', checked: false, priority: 'medium' },
          { id: createId('todo-item'), text: 'Ship today’s blockers', checked: false, priority: 'high' }
        ]
      }
    ]
  },
  packing: {
    title: 'Packing List',
    includeDate: true,
    noteLines: 2,
    templateName: 'Packing',
    sections: [
      {
        id: createId('todo-section'),
        title: 'Trip essentials',
        items: [
          { id: createId('todo-item'), text: 'Passport / ID', checked: false, priority: 'high' },
          { id: createId('todo-item'), text: 'Chargers', checked: false, priority: 'medium' }
        ]
      }
    ]
  },
  home: {
    title: 'Home List',
    includeDate: false,
    noteLines: 4,
    templateName: 'Home',
    sections: [
      {
        id: createId('todo-section'),
        title: 'House',
        items: [
          { id: createId('todo-item'), text: 'Water plants', checked: false, priority: 'low' },
          { id: createId('todo-item'), text: 'Laundry', checked: false, priority: 'medium' }
        ]
      }
    ]
  }
};

export function createDefaultReceiptDocument(): ReceiptPlDocument {
  return {
    storeName: 'SKLEP OSIEDLOWY',
    address: 'ul. Spacerowa 14\n00-120 Warszawa',
    nip: '525-000-11-22',
    receiptNumber: 'PAR/06/001',
    dateTime: formatDateTime(),
    cashier: 'Anna',
    paymentMethod: 'Card',
    paidAmount: 54.67,
    footer: 'Dziekujemy za zakupy\nZapraszamy ponownie',
    disclaimer: 'Helper / sample printout. Not a fiscal receipt.',
    charsPerLine: 36,
    items: [
      {
        id: createId('receipt-item'),
        name: 'Chleb pszenny krojony',
        quantity: 1,
        unit: 'szt',
        unitPrice: 5.99,
        vatRate: 'B 8%'
      },
      {
        id: createId('receipt-item'),
        name: 'Maslo ekstra 200 g',
        quantity: 2,
        unit: 'szt',
        unitPrice: 8.49,
        vatRate: 'A 23%'
      },
      {
        id: createId('receipt-item'),
        name: 'Pomidor malinowy luz',
        quantity: 0.82,
        unit: 'kg',
        unitPrice: 14.99,
        vatRate: 'B 8%'
      }
    ]
  };
}

export function createDefaultTodoDocument(): TodoDocument {
  return JSON.parse(JSON.stringify(TODO_TEMPLATES.shopping)) as TodoDocument;
}

export function createDefaultTextDocument(): TextDocument {
  return {
    title: 'Quick note',
    content: 'Cat Printer studio\nOffline notes ready.\n\nUse this mode for short labels, reminders, and status cards.',
    alignment: 'left',
    bold: false,
    scale: 1,
    charsPerLine: 36
  };
}

export function createDefaultImageDocument(): ImageDocument {
  return {
    title: 'Graphic Print',
    imageDataUrl: '',
    invert: false,
    width: 320,
    padding: 12,
    rotation: 0,
    autoscale: true
  };
}

export function createDefaultDocument(mode: DocumentMode) {
  switch (mode) {
    case 'receipt-pl':
      return createDefaultReceiptDocument();
    case 'todo':
      return createDefaultTodoDocument();
    case 'text':
      return createDefaultTextDocument();
    case 'image':
      return createDefaultImageDocument();
  }
}

export function createDefaultProject(mode: DocumentMode = 'receipt-pl'): SavedProject {
  return {
    id: createId('project'),
    name: getDefaultProjectName(mode),
    mode,
    updatedAt: new Date().toISOString(),
    qualityPresetId: QUALITY_PRESETS[0].id,
    document: createDefaultDocument(mode),
    layoutSettings: {
      showRuler: false
    },
    printSettings: {}
  };
}

export function getDefaultProjectName(mode: DocumentMode): string {
  return mode === 'receipt-pl'
    ? 'Paragon PL'
    : mode === 'todo'
      ? 'TO-DO List'
      : mode === 'text'
        ? 'Text Note'
        : 'Graphic Print';
}
