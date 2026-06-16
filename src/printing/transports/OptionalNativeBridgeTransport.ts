import type { NativeBridgeAdapter, PrintResult, PrinterStatus, PrinterTransport } from '../../types';
import { bitmapPayloadFromCanvas } from '../protocol';

declare global {
  interface Window {
    CatPrinterBridge?: NativeBridgeAdapter;
  }
}

function getNativeBridge(): NativeBridgeAdapter | null {
  return typeof window !== 'undefined' && window.CatPrinterBridge ? window.CatPrinterBridge : null;
}

export class OptionalNativeBridgeTransport implements PrinterTransport {
  kind = 'native-bridge' as const;
  label = 'iOS Native Bridge';

  async isSupported(): Promise<boolean> {
    const bridge = getNativeBridge();
    return bridge ? bridge.isAvailable() : false;
  }

  async connect(): Promise<void> {
    const bridge = getNativeBridge();
    if (!bridge || !(await bridge.isAvailable())) {
      throw new Error('Native bridge not available.');
    }
    await bridge.connect();
  }

  async disconnect(): Promise<void> {
    const bridge = getNativeBridge();
    if (bridge) {
      await bridge.disconnect();
    }
  }

  async getStatus(): Promise<PrinterStatus> {
    const bridge = getNativeBridge();
    if (!bridge) {
      return {
        connected: false,
        batteryLevel: null,
        transport: this.kind,
        message: 'Native bridge not detected.'
      };
    }

    const status = await bridge.getStatus();
    return {
      connected: status.connected,
      batteryLevel: status.batteryLevel ?? null,
      statusCode: status.statusCode ?? null,
      temperature: status.temperature ?? null,
      message: status.message ?? 'Connected through native bridge.',
      transport: this.kind
    };
  }

  async getBatteryLevel(): Promise<number | null> {
    const status = await this.getStatus();
    return status.batteryLevel;
  }

  async printBitmap(job: Parameters<PrinterTransport['printBitmap']>[0]): Promise<PrintResult> {
    const bridge = getNativeBridge();
    if (!bridge || !(await bridge.isAvailable())) {
      throw new Error('Native bridge not available.');
    }

    const bitmap = bitmapPayloadFromCanvas(job.canvas);
    await bridge.printBitmap({
      bytes: Array.from(bitmap.buffer),
      width: bitmap.width,
      height: bitmap.height,
      darkness: job.settings.darkness,
      chunkDelayMs: job.settings.chunkDelayMs
    });

    return {
      ok: true,
      message: 'Printed through native bridge.',
      transport: this.kind
    };
  }
}
