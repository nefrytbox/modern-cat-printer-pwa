import type { PrinterCapabilities, PrinterStatus, TransportKind } from '../../types';

interface PrinterPanelProps {
  capabilities: PrinterCapabilities | null;
  selectedTransport: TransportKind;
  printerStatus: PrinterStatus | null;
  connectedTransport: TransportKind | null;
  busy: 'connect' | 'print' | null;
  onTransportChange: (transport: TransportKind) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onPrint: () => void;
}

export function PrinterPanel({
  capabilities,
  selectedTransport,
  printerStatus,
  connectedTransport,
  busy,
  onTransportChange,
  onConnect,
  onDisconnect,
  onPrint
}: PrinterPanelProps) {
  return (
    <section className="panel card printer-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Printer</p>
          <h2>Connection & transport</h2>
        </div>
      </div>

      <div className="capability-summary">
        <div className="capability-row">
          <span>Environment</span>
          <strong>{capabilities?.environmentLabel ?? 'Detecting…'}</strong>
        </div>
        <div className="capability-row">
          <span>Availability</span>
          <strong>{capabilities?.availabilityMode ?? 'Detecting…'}</strong>
        </div>
        <div className="capability-row">
          <span>Connected</span>
          <strong>{connectedTransport ?? 'No active transport'}</strong>
        </div>
        {printerStatus?.batteryLevel != null ? (
          <div className="capability-row">
            <span>Battery</span>
            <strong>{printerStatus.batteryLevel}%</strong>
          </div>
        ) : null}
      </div>

      <label className="field">
        <span>Transport</span>
        <select value={selectedTransport} onChange={(event) => onTransportChange(event.target.value as TransportKind)}>
          {capabilities?.transports.map((transport) => (
            <option key={transport.kind} value={transport.kind} disabled={!transport.supported}>
              {transport.label}
            </option>
          ))}
        </select>
      </label>

      <div className="transport-hints">
        {capabilities?.transports.map((transport) => (
          <div key={transport.kind} className={`transport-hint ${transport.supported ? 'supported' : 'unsupported'}`}>
            <strong>{transport.label}</strong>
            <span>{transport.reason}</span>
          </div>
        ))}
      </div>

      <p className="info-banner">
        iOS editing, preview, and saved projects work offline as a PWA. Bluetooth printing on iOS needs a native bridge wrapper because iOS Safari/PWA does not expose Web Bluetooth.
      </p>

      {printerStatus?.message ? <p className="status-text">{printerStatus.message}</p> : null}

      <div className="button-row">
        <button type="button" className="primary-button" onClick={onConnect} disabled={busy !== null}>
          {busy === 'connect' ? 'Connecting…' : 'Connect'}
        </button>
        <button type="button" className="secondary-button" onClick={onDisconnect} disabled={busy !== null || !connectedTransport}>
          Disconnect
        </button>
        <button type="button" className="accent-button" onClick={onPrint} disabled={busy !== null}>
          {busy === 'print' ? 'Printing…' : 'Print'}
        </button>
      </div>
    </section>
  );
}
