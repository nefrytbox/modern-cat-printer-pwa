import type { PrintResult, PrinterStatus, PrinterTransport } from '../../types';
import {
  CommandIds,
  CONTROL_WRITE_UUID,
  DATA_WRITE_UUID,
  MAIN_SERVICE_UUID,
  MAIN_SERVICE_UUID_ALT,
  NOTIFY_UUID,
  bitmapPayloadFromCanvas,
  cmdFlush,
  cmdGetBattery,
  cmdGetStatus,
  cmdPrintRequest,
  cmdSetIntensity,
  createCommand,
  parsePrinterStatus
} from '../protocol';

type PendingResolver = {
  resolve: (payload: Uint8Array) => void;
  reject: (error: Error) => void;
  timer: number;
};

export class WebBluetoothTransport implements PrinterTransport {
  kind = 'web-bluetooth' as const;
  label = 'Web Bluetooth';
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private controlChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
  private pending = new Map<number, PendingResolver>();
  private lastKnownBatteryLevel: number | null = null;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not available in this browser.');
    }

    if (this.device?.gatt?.connected) {
      return;
    }

    try {
      this.device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [MAIN_SERVICE_UUID] }, { services: [MAIN_SERVICE_UUID_ALT] }],
        optionalServices: [MAIN_SERVICE_UUID, MAIN_SERVICE_UUID_ALT, CONTROL_WRITE_UUID, DATA_WRITE_UUID]
      });
    } catch {
      this.device = await navigator.bluetooth!.requestDevice({
        acceptAllDevices: true,
        optionalServices: [MAIN_SERVICE_UUID, MAIN_SERVICE_UUID_ALT, CONTROL_WRITE_UUID, DATA_WRITE_UUID]
      });
    }

    if (!this.device.gatt) {
      throw new Error('Bluetooth GATT server is unavailable.');
    }

    this.server = await this.device.gatt.connect();
    const service = await this.getPrimaryService();
    this.controlChar = await service.getCharacteristic(CONTROL_WRITE_UUID);
    this.dataChar = await service.getCharacteristic(DATA_WRITE_UUID);
    this.notifyChar = await service.getCharacteristic(NOTIFY_UUID);
    await this.notifyChar.startNotifications();
    this.notifyChar.addEventListener('characteristicvaluechanged', this.handleNotification);
  }

  async disconnect(): Promise<void> {
    if (this.notifyChar) {
      this.notifyChar.removeEventListener('characteristicvaluechanged', this.handleNotification);
      try {
        await this.notifyChar.stopNotifications();
      } catch {
        // Ignore notification stop failures during teardown.
      }
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.server = null;
    this.controlChar = null;
    this.dataChar = null;
    this.notifyChar = null;
  }

  async getStatus(): Promise<PrinterStatus> {
    this.assertConnected();
    await this.controlChar!.writeValue(cmdGetStatus());
    const payload = await this.waitForNotification(CommandIds.GetStatus, 5000);
    const status = parsePrinterStatus(payload, this.kind);
    this.lastKnownBatteryLevel = status.batteryLevel;
    return status;
  }

  async getBatteryLevel(): Promise<number | null> {
    this.assertConnected();

    try {
      await this.controlChar!.writeValue(cmdGetBattery());
      const payload = await this.waitForNotification(CommandIds.GetBattery, 5000);
      this.lastKnownBatteryLevel = payload[0] ?? this.lastKnownBatteryLevel;
      return this.lastKnownBatteryLevel;
    } catch {
      return (await this.getStatus()).batteryLevel;
    }
  }

  async printBitmap(job: Parameters<PrinterTransport['printBitmap']>[0]): Promise<PrintResult> {
    this.assertConnected();

    const status = await this.getStatus();
    if (status.message?.startsWith('Printer error')) {
      throw new Error(status.message);
    }

    const bitmap = bitmapPayloadFromCanvas(job.canvas);

    await this.controlChar!.writeValue(cmdSetIntensity(job.settings.darkness));
    await this.controlChar!.writeValue(cmdPrintRequest(bitmap.lines));
    const ack = await this.waitForNotification(CommandIds.PrintRequest, 5000);
    if (!ack.length || ack[0] !== 0x00) {
      throw new Error(`Printer rejected the print job (${ack[0] ?? 'no response'}).`);
    }

    for (let offset = 0; offset < bitmap.buffer.length; offset += 48) {
      const chunk = bitmap.buffer.slice(offset, offset + 48);
      await this.dataChar!.writeValueWithoutResponse(chunk);
      await wait(job.settings.chunkDelayMs);
    }

    await this.controlChar!.writeValue(cmdFlush());
    await this.waitForNotification(CommandIds.PrintComplete, 20000);

    return {
      ok: true,
      message: `Printed "${job.title}" via Web Bluetooth.`,
      transport: this.kind
    };
  }

  private async getPrimaryService(): Promise<BluetoothRemoteGATTService> {
    if (!this.server) {
      throw new Error('Bluetooth server not ready.');
    }

    try {
      return await this.server.getPrimaryService(MAIN_SERVICE_UUID);
    } catch {
      return this.server.getPrimaryService(MAIN_SERVICE_UUID_ALT);
    }
  }

  private readonly handleNotification = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic | null;
    if (!target?.value) {
      return;
    }

    const data = new Uint8Array(target.value.buffer);
    if (data[0] !== 0x22 || data[1] !== 0x21) {
      return;
    }

    const commandId = data[2];
    const length = data[4] | (data[5] << 8);
    const payload = data.slice(6, 6 + length);
    const pending = this.pending.get(commandId);
    if (!pending) {
      return;
    }

    window.clearTimeout(pending.timer);
    this.pending.delete(commandId);
    pending.resolve(payload);
  };

  private waitForNotification(commandId: number, timeoutMs: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(commandId);
        reject(new Error(`Timeout waiting for printer response 0x${commandId.toString(16)}`));
      }, timeoutMs);

      this.pending.set(commandId, { resolve, reject, timer });
    });
  }

  private assertConnected(): void {
    if (!this.device?.gatt?.connected || !this.controlChar || !this.dataChar) {
      throw new Error('Printer is not connected.');
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
