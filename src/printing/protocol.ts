import type { BitmapPrintJob, PrinterStatus } from '../types';

export const PRINTER_WIDTH = 384;
export const PRINTER_WIDTH_BYTES = PRINTER_WIDTH / 8;
export const MIN_DATA_BYTES = 90 * PRINTER_WIDTH_BYTES;
export const MAIN_SERVICE_UUID = '0000ae30-0000-1000-8000-00805f9b34fb';
export const MAIN_SERVICE_UUID_ALT = '0000af30-0000-1000-8000-00805f9b34fb';
export const CONTROL_WRITE_UUID = '0000ae01-0000-1000-8000-00805f9b34fb';
export const NOTIFY_UUID = '0000ae02-0000-1000-8000-00805f9b34fb';
export const DATA_WRITE_UUID = '0000ae03-0000-1000-8000-00805f9b34fb';

export const CommandIds = {
  GetStatus: 0xa1,
  SetIntensity: 0xa2,
  PrintRequest: 0xa9,
  PrintComplete: 0xaa,
  GetBattery: 0xab,
  Flush: 0xad
} as const;

const CRC8_TABLE = [
  0x00, 0x07, 0x0e, 0x09, 0x1c, 0x1b, 0x12, 0x15, 0x38, 0x3f, 0x36, 0x31, 0x24, 0x23, 0x2a, 0x2d,
  0x70, 0x77, 0x7e, 0x79, 0x6c, 0x6b, 0x62, 0x65, 0x48, 0x4f, 0x46, 0x41, 0x54, 0x53, 0x5a, 0x5d,
  0xe0, 0xe7, 0xee, 0xe9, 0xfc, 0xfb, 0xf2, 0xf5, 0xd8, 0xdf, 0xd6, 0xd1, 0xc4, 0xc3, 0xca, 0xcd,
  0x90, 0x97, 0x9e, 0x99, 0x8c, 0x8b, 0x82, 0x85, 0xa8, 0xaf, 0xa6, 0xa1, 0xb4, 0xb3, 0xba, 0xbd,
  0xc7, 0xc0, 0xc9, 0xce, 0xdb, 0xdc, 0xd5, 0xd2, 0xff, 0xf8, 0xf1, 0xf6, 0xe3, 0xe4, 0xed, 0xea,
  0xb7, 0xb0, 0xb9, 0xbe, 0xab, 0xac, 0xa5, 0xa2, 0x8f, 0x88, 0x81, 0x86, 0x93, 0x94, 0x9d, 0x9a,
  0x27, 0x20, 0x29, 0x2e, 0x3b, 0x3c, 0x35, 0x32, 0x1f, 0x18, 0x11, 0x16, 0x03, 0x04, 0x0d, 0x0a,
  0x57, 0x50, 0x59, 0x5e, 0x4b, 0x4c, 0x45, 0x42, 0x6f, 0x68, 0x61, 0x66, 0x73, 0x74, 0x7d, 0x7a,
  0x89, 0x8e, 0x87, 0x80, 0x95, 0x92, 0x9b, 0x9c, 0xb1, 0xb6, 0xbf, 0xb8, 0xad, 0xaa, 0xa3, 0xa4,
  0xf9, 0xfe, 0xf7, 0xf0, 0xe5, 0xe2, 0xeb, 0xec, 0xc1, 0xc6, 0xcf, 0xc8, 0xdd, 0xda, 0xd3, 0xd4,
  0x69, 0x6e, 0x67, 0x60, 0x75, 0x72, 0x7b, 0x7c, 0x51, 0x56, 0x5f, 0x58, 0x4d, 0x4a, 0x43, 0x44,
  0x19, 0x1e, 0x17, 0x10, 0x05, 0x02, 0x0b, 0x0c, 0x21, 0x26, 0x2f, 0x28, 0x3d, 0x3a, 0x33, 0x34,
  0x4e, 0x49, 0x40, 0x47, 0x52, 0x55, 0x5c, 0x5b, 0x76, 0x71, 0x78, 0x7f, 0x6a, 0x6d, 0x64, 0x63,
  0x3e, 0x39, 0x30, 0x37, 0x22, 0x25, 0x2c, 0x2b, 0x06, 0x01, 0x08, 0x0f, 0x1a, 0x1d, 0x14, 0x13,
  0xae, 0xa9, 0xa0, 0xa7, 0xb2, 0xb5, 0xbc, 0xbb, 0x96, 0x91, 0x98, 0x9f, 0x8a, 0x8d, 0x84, 0x83,
  0xde, 0xd9, 0xd0, 0xd7, 0xc2, 0xc5, 0xcc, 0xcb, 0xe6, 0xe1, 0xe8, 0xef, 0xfa, 0xfd, 0xf4, 0xf3
];

export function calculateCRC8(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc = CRC8_TABLE[(crc ^ byte) & 0xff];
  }
  return crc;
}

export function createCommand(commandId: number, payload: Uint8Array): Uint8Array {
  const header = [0x22, 0x21, commandId & 0xff, 0x00, payload.length & 0xff, (payload.length >> 8) & 0xff];
  const command = new Uint8Array([...header, ...payload, calculateCRC8(payload), 0xff]);
  return command;
}

export function cmdSetIntensity(intensity: number): Uint8Array {
  return createCommand(CommandIds.SetIntensity, Uint8Array.of(intensity));
}

export function cmdGetStatus(): Uint8Array {
  return createCommand(CommandIds.GetStatus, Uint8Array.of(0x00));
}

export function cmdGetBattery(): Uint8Array {
  return createCommand(CommandIds.GetBattery, Uint8Array.of(0x00));
}

export function cmdPrintRequest(lines: number): Uint8Array {
  const payload = new Uint8Array([lines & 0xff, (lines >> 8) & 0xff, 0x30, 0x00]);
  return createCommand(CommandIds.PrintRequest, payload);
}

export function cmdFlush(): Uint8Array {
  return createCommand(CommandIds.Flush, Uint8Array.of(0x00));
}

export function encode1bppRow(row: boolean[]): Uint8Array {
  const bytes = new Uint8Array(PRINTER_WIDTH_BYTES);
  for (let byteIndex = 0; byteIndex < PRINTER_WIDTH_BYTES; byteIndex += 1) {
    let byteValue = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      if (row[byteIndex * 8 + bit]) {
        byteValue |= 1 << bit;
      }
    }
    bytes[byteIndex] = byteValue;
  }
  return bytes;
}

export function bitmapPayloadFromCanvas(canvas: HTMLCanvasElement): {
  buffer: Uint8Array;
  lines: number;
  width: number;
  height: number;
} {
  const scaled = canvas.width === PRINTER_WIDTH ? canvas : scaleCanvas(canvas, PRINTER_WIDTH);
  const context = scaled.getContext('2d');
  if (!context) {
    throw new Error('Preview canvas is not ready for printing.');
  }

  const { width, height } = scaled;
  const image = context.getImageData(0, 0, width, height).data;
  const rows: boolean[][] = [];

  for (let y = 0; y < height; y += 1) {
    const row = new Array(width).fill(false);
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const luminance = 0.299 * image[pixel] + 0.587 * image[pixel + 1] + 0.114 * image[pixel + 2];
      row[x] = luminance < 128;
    }
    rows.push(row);
  }

  const rotated = rows.reverse().map((row) => row.slice().reverse());
  const payload: number[] = [];
  rotated.forEach((row) => {
    payload.push(...encode1bppRow(row));
  });

  while (payload.length < MIN_DATA_BYTES) {
    payload.push(0x00);
  }

  return {
    buffer: new Uint8Array(payload),
    lines: height,
    width,
    height
  };
}

export function parsePrinterStatus(payload: Uint8Array, transport: PrinterStatus['transport']): PrinterStatus {
  return {
    connected: true,
    batteryLevel: payload.length >= 10 ? payload[9] : null,
    statusCode: payload.length >= 7 ? payload[6] : null,
    temperature: payload.length >= 11 ? payload[10] : null,
    message: payload.length >= 14 && payload[12] !== 0 ? `Printer error ${payload[13]}` : 'Ready',
    transport
  };
}

function scaleCanvas(source: HTMLCanvasElement, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(1, Math.round((source.height / source.width) * width));
  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}
