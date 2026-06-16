export type DocumentMode = 'receipt-pl' | 'todo' | 'text' | 'image';

export type TransportKind = 'web-bluetooth' | 'native-bridge' | 'mock' | 'unavailable';

export type DitheringMethod = 'threshold' | 'ordered' | 'floyd-steinberg';

export type TextAlignment = 'left' | 'center' | 'right';

export type ReceiptVatRate = 'A 23%' | 'B 8%' | 'C 5%' | 'ZW';

export type TodoPriority = 'low' | 'medium' | 'high';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: ReceiptVatRate;
}

export interface ReceiptPlDocument {
  storeName: string;
  address: string;
  nip: string;
  receiptNumber: string;
  dateTime: string;
  cashier: string;
  paymentMethod: string;
  paidAmount: number;
  footer: string;
  disclaimer: string;
  charsPerLine: 32 | 36 | 42;
  items: ReceiptItem[];
}

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
  priority: TodoPriority;
}

export interface TodoSection {
  id: string;
  title: string;
  items: TodoItem[];
}

export interface TodoDocument {
  title: string;
  includeDate: boolean;
  noteLines: number;
  sections: TodoSection[];
  templateName: string;
}

export interface TextDocument {
  title: string;
  content: string;
  alignment: TextAlignment;
  bold: boolean;
  scale: number;
  charsPerLine: 32 | 36 | 42;
}

export interface ImageDocument {
  title: string;
  imageDataUrl: string;
  invert: boolean;
  width: number;
  padding: number;
  rotation: 0 | 90 | 180 | 270;
  autoscale: boolean;
}

export type ProjectDocument = ReceiptPlDocument | TodoDocument | TextDocument | ImageDocument;

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintQualityPreset {
  id: string;
  label: string;
  paperWidthMm: 57 | 58;
  printWidthPx: number;
  charsPerLine: 32 | 36 | 42;
  dithering: DitheringMethod;
  threshold: number;
  contrast: number;
  gamma: number;
  darkness: number;
  feedBefore: number;
  feedAfter: number;
  chunkDelayMs: number;
  margins: Margins;
  interline: number;
}

export type PrintSettingsOverride = Partial<Omit<PrintQualityPreset, 'id' | 'label'>>;

export interface SavedProject {
  id: string;
  name: string;
  mode: DocumentMode;
  updatedAt: string;
  qualityPresetId: string;
  document: ProjectDocument;
  layoutSettings: {
    showRuler: boolean;
  };
  printSettings: PrintSettingsOverride;
}

export interface PrinterStatus {
  connected: boolean;
  batteryLevel: number | null;
  statusCode?: number | null;
  temperature?: number | null;
  message?: string;
  transport: TransportKind;
}

export interface BitmapPrintJob {
  canvas: HTMLCanvasElement;
  settings: PrintQualityPreset;
  title: string;
}

export interface PrintResult {
  ok: boolean;
  message: string;
  transport: TransportKind;
}

export interface PrinterTransport {
  kind: TransportKind;
  label: string;
  isSupported(): Promise<boolean> | boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  getBatteryLevel(): Promise<number | null>;
  printBitmap(job: BitmapPrintJob): Promise<PrintResult>;
}

export interface NativeBridgeStatus {
  connected: boolean;
  batteryLevel?: number | null;
  statusCode?: number | null;
  temperature?: number | null;
  message?: string;
}

export interface NativeBridgeAdapter {
  isAvailable(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  printBitmap(payload: {
    bytes: number[];
    width: number;
    height: number;
    darkness: number;
    chunkDelayMs: number;
  }): Promise<void>;
  getStatus(): Promise<NativeBridgeStatus>;
}

export interface TransportAvailability {
  kind: TransportKind;
  label: string;
  supported: boolean;
  reason: string;
}

export interface PrinterCapabilities {
  environmentLabel: string;
  availabilityMode: 'full' | 'mock-only' | 'preview-only';
  recommendedKind: TransportKind;
  transports: TransportAvailability[];
}

export interface ThermalLine {
  text: string;
  align?: TextAlignment;
  bold?: boolean;
  scale?: number;
}

export interface ThermalLayout {
  widthChars: number;
  lines: ThermalLine[];
}
