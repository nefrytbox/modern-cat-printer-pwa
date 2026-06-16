import type { ImageDocument } from '../../types';

interface ImageEditorProps {
  document: ImageDocument;
  onChange: (changes: Partial<ImageDocument>) => void;
  onImageSelect: (file: File | null) => void;
}

export function ImageEditor({ document, onChange, onImageSelect }: ImageEditorProps) {
  return (
    <section className="card editor-card">
      <p className="eyebrow">Bitmap mode</p>
      <h3>Image / graphic</h3>

      <label className="field">
        <span>Upload image</span>
        <input type="file" accept="image/*" onChange={(event) => onImageSelect(event.target.files?.[0] ?? null)} />
      </label>

      <div className="field-grid four-up">
        <label className="field">
          <span>Width (px)</span>
          <input
            type="number"
            min={64}
            max={384}
            value={document.width}
            onChange={(event) => onChange({ width: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Padding (px)</span>
          <input
            type="number"
            min={0}
            max={48}
            value={document.padding}
            onChange={(event) => onChange({ padding: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Rotation</span>
          <select value={document.rotation} onChange={(event) => onChange({ rotation: Number(event.target.value) as ImageDocument['rotation'] })}>
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </label>
        <label className="field">
          <span>Title</span>
          <input value={document.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
      </div>

      <div className="field-grid two-up">
        <label className="checkbox-field">
          <input type="checkbox" checked={document.autoscale} onChange={(event) => onChange({ autoscale: event.target.checked })} />
          <span>Auto scale to width</span>
        </label>
        <label className="checkbox-field">
          <input type="checkbox" checked={document.invert} onChange={(event) => onChange({ invert: event.target.checked })} />
          <span>Invert bitmap</span>
        </label>
      </div>

      <p className="info-banner">
        Image preview remains available offline after the file is stored inside the project JSON / IndexedDB draft.
      </p>
    </section>
  );
}
