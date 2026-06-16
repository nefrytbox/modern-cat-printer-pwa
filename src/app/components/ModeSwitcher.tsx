import type { DocumentMode } from '../../types';

const MODES: Array<{ id: DocumentMode; label: string; description: string }> = [
  { id: 'receipt-pl', label: 'Paragon PL', description: 'Thermal-style Polish receipt template' },
  { id: 'todo', label: 'TO-DO List', description: 'Checklist sections, priorities, and notes' },
  { id: 'text', label: 'Text', description: 'Quick text cards with alignment and bold raster text' },
  { id: 'image', label: 'Image / Graphic', description: 'Bitmap upload with thermal processing' }
];

interface ModeSwitcherProps {
  activeMode: DocumentMode;
  onSelect: (mode: DocumentMode) => void;
}

export function ModeSwitcher({ activeMode, onSelect }: ModeSwitcherProps) {
  return (
    <div className="mode-switcher" role="tablist" aria-label="Print mode">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          className={`mode-tab ${activeMode === mode.id ? 'active' : ''}`}
          aria-selected={activeMode === mode.id}
          onClick={() => onSelect(mode.id)}
        >
          <span>{mode.label}</span>
          <small>{mode.description}</small>
        </button>
      ))}
    </div>
  );
}
