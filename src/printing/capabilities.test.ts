import { detectPrinterCapabilities } from './capabilities';
import type { PrinterTransport } from '../types';

function createTransport(kind: PrinterTransport['kind'], supported: boolean): PrinterTransport {
  return {
    kind,
    label: kind,
    isSupported: async () => supported,
    connect: async () => undefined,
    disconnect: async () => undefined,
    getStatus: async () => ({
      connected: false,
      batteryLevel: null,
      transport: kind
    }),
    getBatteryLevel: async () => null,
    printBitmap: async () => ({
      ok: true,
      message: 'ok',
      transport: kind
    })
  };
}

describe('printer capability selection', () => {
  it('prefers native bridge when available', async () => {
    const capabilities = await detectPrinterCapabilities({
      'web-bluetooth': createTransport('web-bluetooth', true),
      'native-bridge': createTransport('native-bridge', true),
      mock: createTransport('mock', true)
    });

    expect(capabilities.recommendedKind).toBe('native-bridge');
    expect(capabilities.availabilityMode).toBe('full');
  });

  it('falls back to preview-only messaging when only mock is usable', async () => {
    const capabilities = await detectPrinterCapabilities({
      'web-bluetooth': createTransport('web-bluetooth', false),
      'native-bridge': createTransport('native-bridge', false),
      mock: createTransport('mock', true)
    });

    expect(capabilities.recommendedKind).toBe('mock');
    expect(['mock-only', 'preview-only']).toContain(capabilities.availabilityMode);
  });
});
