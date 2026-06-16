import { QUALITY_PRESETS } from '../../presets/qualityPresets';
import type { PrintQualityPreset, PrintSettingsOverride } from '../../types';

interface QualityPanelProps {
  presetId: string;
  resolvedSettings: PrintQualityPreset;
  overrides: PrintSettingsOverride;
  onPresetChange: (presetId: string) => void;
  onOverrideChange: (changes: PrintSettingsOverride) => void;
}

export function QualityPanel({ presetId, resolvedSettings, overrides, onPresetChange, onOverrideChange }: QualityPanelProps) {
  return (
    <section className="panel card quality-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Quality</p>
          <h2>Paper presets</h2>
        </div>
      </div>

      <label className="field">
        <span>Preset</span>
        <select value={presetId} onChange={(event) => onPresetChange(event.target.value)}>
          {QUALITY_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>

      <div className="preset-grid">
        <div className="metric">
          <span>Paper</span>
          <strong>{resolvedSettings.paperWidthMm} mm</strong>
        </div>
        <div className="metric">
          <span>Preview width</span>
          <strong>{resolvedSettings.printWidthPx}px</strong>
        </div>
        <div className="metric">
          <span>Dithering</span>
          <strong>{resolvedSettings.dithering}</strong>
        </div>
        <div className="metric">
          <span>Darkness</span>
          <strong>{resolvedSettings.darkness}</strong>
        </div>
      </div>

      <details className="advanced-settings">
        <summary>Advanced controls</summary>

        <div className="field-grid">
          <label className="field">
            <span>Threshold</span>
            <input
              type="range"
              min={80}
              max={220}
              value={resolvedSettings.threshold}
              onChange={(event) => onOverrideChange({ threshold: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Contrast</span>
            <input
              type="range"
              min={-40}
              max={40}
              value={resolvedSettings.contrast}
              onChange={(event) => onOverrideChange({ contrast: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Gamma</span>
            <input
              type="number"
              step={0.05}
              min={0.6}
              max={1.4}
              value={resolvedSettings.gamma}
              onChange={(event) => onOverrideChange({ gamma: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Darkness</span>
            <input
              type="number"
              min={40}
              max={120}
              value={resolvedSettings.darkness}
              onChange={(event) => onOverrideChange({ darkness: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Chunk delay (ms)</span>
            <input
              type="number"
              min={5}
              max={60}
              value={resolvedSettings.chunkDelayMs}
              onChange={(event) => onOverrideChange({ chunkDelayMs: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Feed before</span>
            <input
              type="number"
              min={0}
              max={48}
              value={resolvedSettings.feedBefore}
              onChange={(event) => onOverrideChange({ feedBefore: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Feed after</span>
            <input
              type="number"
              min={0}
              max={64}
              value={resolvedSettings.feedAfter}
              onChange={(event) => onOverrideChange({ feedAfter: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Interline</span>
            <input
              type="number"
              step={0.05}
              min={1}
              max={1.6}
              value={resolvedSettings.interline}
              onChange={(event) => onOverrideChange({ interline: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Paper width</span>
            <select
              value={resolvedSettings.paperWidthMm}
              onChange={(event) => onOverrideChange({ paperWidthMm: Number(event.target.value) as 57 | 58 })}
            >
              <option value={57}>57 mm</option>
              <option value={58}>58 mm</option>
            </select>
          </label>
          <label className="field">
            <span>Preview width (px)</span>
            <input
              type="number"
              min={320}
              max={384}
              value={resolvedSettings.printWidthPx}
              onChange={(event) => onOverrideChange({ printWidthPx: Number(event.target.value) })}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Margin top</span>
            <input
              type="number"
              min={0}
              max={40}
              value={resolvedSettings.margins.top}
              onChange={(event) =>
                onOverrideChange({ margins: { ...resolvedSettings.margins, top: Number(event.target.value) } })
              }
            />
          </label>
          <label className="field">
            <span>Margin right</span>
            <input
              type="number"
              min={0}
              max={40}
              value={resolvedSettings.margins.right}
              onChange={(event) =>
                onOverrideChange({ margins: { ...resolvedSettings.margins, right: Number(event.target.value) } })
              }
            />
          </label>
          <label className="field">
            <span>Margin bottom</span>
            <input
              type="number"
              min={0}
              max={40}
              value={resolvedSettings.margins.bottom}
              onChange={(event) =>
                onOverrideChange({ margins: { ...resolvedSettings.margins, bottom: Number(event.target.value) } })
              }
            />
          </label>
          <label className="field">
            <span>Margin left</span>
            <input
              type="number"
              min={0}
              max={40}
              value={resolvedSettings.margins.left}
              onChange={(event) =>
                onOverrideChange({ margins: { ...resolvedSettings.margins, left: Number(event.target.value) } })
              }
            />
          </label>
        </div>
      </details>

      {Object.keys(overrides).length ? (
        <button type="button" className="ghost-button" onClick={() => onOverrideChange({})}>
          Reset overrides
        </button>
      ) : null}
    </section>
  );
}
