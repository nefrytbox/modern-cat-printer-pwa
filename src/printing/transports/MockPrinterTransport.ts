import type { PrintResult, PrinterStatus, PrinterTransport } from '../../types';

export class MockPrinterTransport implements PrinterTransport {
  kind = 'mock' as const;
  label = 'Mock Printer';
  private connected = false;

  isSupported(): boolean {
    return true;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getStatus(): Promise<PrinterStatus> {
    return {
      connected: this.connected,
      batteryLevel: 100,
      transport: this.kind,
      message: this.connected ? 'Mock printer ready.' : 'Mock printer idle.'
    };
  }

  async getBatteryLevel(): Promise<number> {
    return 100;
  }

  async printBitmap(job: Parameters<PrinterTransport['printBitmap']>[0]): Promise<PrintResult> {
    if (!this.connected) {
      throw new Error('Mock printer is not connected.');
    }

    await new Promise((resolve) => setTimeout(resolve, 450));

    return {
      ok: true,
      message: `Mock print complete for "${job.title}".`,
      transport: this.kind
    };
  }
}
