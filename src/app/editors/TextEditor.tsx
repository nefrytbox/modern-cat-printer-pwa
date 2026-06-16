import type { TextDocument } from '../../types';

interface TextEditorProps {
  document: TextDocument;
  onChange: (changes: Partial<TextDocument>) => void;
}

export function TextEditor({ document, onChange }: TextEditorProps) {
  return (
    <section className="card editor-card">
      <p className="eyebrow">Free text</p>
      <h3>Text mode</h3>
      <div className="field-grid three-up">
        <label className="field">
          <span>Title</span>
          <input value={document.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label className="field">
          <span>Alignment</span>
          <select value={document.alignment} onChange={(event) => onChange({ alignment: event.target.value as TextDocument['alignment'] })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="field">
          <span>Chars / line</span>
          <select value={document.charsPerLine} onChange={(event) => onChange({ charsPerLine: Number(event.target.value) as 32 | 36 | 42 })}>
            <option value={32}>32</option>
            <option value={36}>36</option>
            <option value={42}>42</option>
          </select>
        </label>
      </div>

      <div className="field-grid three-up">
        <label className="checkbox-field">
          <input type="checkbox" checked={document.bold} onChange={(event) => onChange({ bold: event.target.checked })} />
          <span>Simulate bold</span>
        </label>
        <label className="field">
          <span>Scale</span>
          <input
            type="number"
            step={0.1}
            min={0.8}
            max={2}
            value={document.scale}
            onChange={(event) => onChange({ scale: Number(event.target.value) })}
          />
        </label>
      </div>

      <label className="field">
        <span>Content</span>
        <textarea rows={14} value={document.content} onChange={(event) => onChange({ content: event.target.value })} />
      </label>
    </section>
  );
}
