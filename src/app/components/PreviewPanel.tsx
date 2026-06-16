interface PreviewPanelProps {
  previewUrl: string;
  isRendering: boolean;
  showRuler: boolean;
  disclaimer: string;
  offlineReady: boolean;
  activePresetLabel: string;
}

export function PreviewPanel({
  previewUrl,
  isRendering,
  showRuler,
  disclaimer,
  offlineReady,
  activePresetLabel
}: PreviewPanelProps) {
  return (
    <section className="panel card preview-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live preview</p>
          <h2>Thermal paper</h2>
        </div>
        <div className="status-pills">
          <span className="status-pill">{activePresetLabel}</span>
          {offlineReady ? <span className="status-pill success">Offline ready</span> : null}
        </div>
      </div>

      <div className={`paper-preview ${showRuler ? 'with-ruler' : ''}`}>
        {previewUrl ? <img src={previewUrl} alt="Thermal print preview" className="paper-preview__image" /> : null}
        {isRendering ? <div className="paper-preview__overlay">Rendering preview…</div> : null}
      </div>

      <p className="preview-caption">{disclaimer}</p>
    </section>
  );
}
