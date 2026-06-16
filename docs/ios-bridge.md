# iOS Native Bridge Contract

This project intentionally separates the print transport from the UI. The web app can run offline as a PWA, but iOS Bluetooth printing requires a native bridge.

## Expected global API

Expose the following object on `window`:

```ts
window.CatPrinterBridge = {
  async isAvailable(): Promise<boolean>,
  async connect(): Promise<void>,
  async disconnect(): Promise<void>,
  async getStatus(): Promise<{
    connected: boolean
    batteryLevel?: number | null
    statusCode?: number | null
    temperature?: number | null
    message?: string
  }>,
  async printBitmap(payload: {
    bytes: number[]
    width: number
    height: number
    darkness: number
    chunkDelayMs: number
  }): Promise<void>
}
```

## Recommended native implementation

Option 1: Capacitor / Ionic plugin

- Create a Capacitor plugin wrapping CoreBluetooth.
- Expose `connect`, `disconnect`, `getStatus`, and `printBitmap`.
- Inject the bridge into the WebView on startup.

Option 2: Minimal Swift wrapper

- `WKWebView` hosts the built app.
- `WKScriptMessageHandler` passes commands from JS to Swift.
- Swift CoreBluetooth layer handles:
  - service discovery
  - characteristic writes
  - status notifications
  - pacing of BLE chunks
- Swift reports results back with `evaluateJavaScript`.

## Data expectations

- The web layer already prepares MXW01-compatible 1bpp bitmap payloads.
- Native code receives:
  - packed bytes
  - source width / height
  - darkness value
  - BLE chunk delay
- Native code should preserve the same command flow:
  - `A2` set intensity
  - `A1` status
  - `A9` print request
  - `AE03` data transfer
  - `AD` flush
  - `AA` print complete
