import type { PrinterCapabilities, PrinterTransport, TransportAvailability, TransportKind } from '../types';
import { isIosDevice, isStandalonePwa, supportsWebBluetooth } from '../utils/platform';
import { OptionalNativeBridgeTransport } from './transports/OptionalNativeBridgeTransport';
import { MockPrinterTransport } from './transports/MockPrinterTransport';
import { WebBluetoothTransport } from './transports/WebBluetoothTransport';

export function createTransportRegistry(): Record<'web-bluetooth' | 'native-bridge' | 'mock', PrinterTransport> {
  return {
    'web-bluetooth': new WebBluetoothTransport(),
    'native-bridge': new OptionalNativeBridgeTransport(),
    mock: new MockPrinterTransport()
  };
}

export async function detectPrinterCapabilities(transports = createTransportRegistry()): Promise<PrinterCapabilities> {
  const webBluetoothSupported = await transports['web-bluetooth'].isSupported();
  const nativeBridgeSupported = await transports['native-bridge'].isSupported();
  const ios = isIosDevice();
  const standalone = isStandalonePwa();

  const transportStates: TransportAvailability[] = [
    {
      kind: 'web-bluetooth',
      label: 'Web Bluetooth',
      supported: Boolean(webBluetoothSupported),
      reason: webBluetoothSupported
        ? 'Available in this browser.'
        : ios
          ? 'iOS Safari / iOS PWA does not expose Web Bluetooth.'
          : 'Use a supported browser such as Chrome or Edge.'
    },
    {
      kind: 'native-bridge',
      label: 'iOS Native Bridge',
      supported: Boolean(nativeBridgeSupported),
      reason: nativeBridgeSupported ? 'Native wrapper detected.' : 'No native CoreBluetooth bridge detected.'
    },
    {
      kind: 'mock',
      label: 'Mock Printer',
      supported: true,
      reason: 'Always available for preview and no-device testing.'
    }
  ];

  let recommendedKind: TransportKind = 'mock';
  if (nativeBridgeSupported) {
    recommendedKind = 'native-bridge';
  } else if (webBluetoothSupported) {
    recommendedKind = 'web-bluetooth';
  }

  const availabilityMode =
    nativeBridgeSupported || webBluetoothSupported ? 'full' : supportsWebBluetooth() ? 'mock-only' : 'preview-only';

  return {
    environmentLabel: standalone && ios ? 'iOS PWA' : ios ? 'iOS browser' : standalone ? 'Installed PWA' : 'Browser tab',
    availabilityMode,
    recommendedKind,
    transports: transportStates
  };
}
