# Modern Cat Printer PWA

Offline-first web app / PWA for Cat Printer / MXW01 with:

- `Paragon PL` receipt layouts
- `TO-DO List` printing
- free-form `Text` mode
- `Image / Graphic` bitmap printing
- local project storage with autosave, duplicate, delete, export/import
- Web Bluetooth printing where supported
- mock printing for no-device testing
- explicit iOS limitation messaging and native bridge extension points

## Tech stack

- React + TypeScript + Vite
- `vite-plugin-pwa` for manifest + service worker
- Vitest for unit tests

## Local development

This workspace uses the bundled Codex runtime Node.js. If `node` is not on your system PATH, use the bundled one:

```bash
PATH=/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs install
```

Run the app:

```bash
PATH=/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs dev
```

Build:

```bash
PATH=/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs build
```

Run tests:

```bash
PATH=/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
/Users/iwojoa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.mjs test
```

## PWA install on iPhone / iPad

1. Open the deployed app in Safari.
2. Tap `Share`.
3. Choose `Add to Home Screen`.
4. Launch it from the Home Screen.
5. Once opened online at least once, the app shell, preview, and saved projects are available offline.

## Honest Bluetooth limitation on iOS

- Offline editing and preview work in iOS Safari/PWA.
- Web Bluetooth printing does **not** work in iOS Safari / iOS PWA because the platform does not expose the Web Bluetooth API there.
- To print on iOS, use a native wrapper with a bridge such as Capacitor or a minimal Swift app exposing CoreBluetooth to the web UI.

See [docs/ios-bridge.md](./docs/ios-bridge.md) for the bridge contract used by this app.
