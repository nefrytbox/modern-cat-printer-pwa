import { TODO_TEMPLATES } from '../../defaults';
import type { TodoDocument, TodoItem, TodoSection } from '../../types';

interface TodoEditorProps {
  document: TodoDocument;
  onChange: (changes: Partial<TodoDocument>) => void;
  onApplyTemplate: (templateKey: string) => void;
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, changes: Partial<TodoSection>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, changes: Partial<TodoItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
}

export function TodoEditor({
  document,
  onChange,
  onApplyTemplate,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: TodoEditorProps) {
  return (
    <div className="editor-stack">
      <section className="card editor-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Checklist</p>
            <h3>TO-DO list</h3>
          </div>
        </div>

        <div className="field-grid three-up">
          <label className="field">
            <span>Title</span>
            <input value={document.title} onChange={(event) => onChange({ title: event.target.value })} />
          </label>
          <label className="field">
            <span>Quick template</span>
            <select value={document.templateName.toLowerCase()} onChange={(event) => onApplyTemplate(event.target.value)}>
              {Object.entries(TODO_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Blank note lines</span>
            <input
              type="number"
              min={0}
              max={10}
              value={document.noteLines}
              onChange={(event) => onChange({ noteLines: Number(event.target.value) })}
            />
          </label>
        </div>

        <label className="checkbox-field">
          <input type="checkbox" checked={document.includeDate} onChange={(event) => onChange({ includeDate: event.target.checked })} />
          <span>Print current date</span>
        </label>
      </section>

      <section className="card editor-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Sections</p>
            <h3>Checklist structure</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onAddSection}>
            Add section
          </button>
        </div>

        <div className="item-list">
          {document.sections.map((section) => (
            <div key={section.id} className="section-card">
              <div className="panel-header compact">
                <label className="field section-title-field">
                  <span>Section title</span>
                  <input value={section.title} onChange={(event) => onUpdateSection(section.id, { title: event.target.value })} />
                </label>
                <button type="button" className="ghost-button" onClick={() => onRemoveSection(section.id)}>
                  Remove
                </button>
              </div>

              {section.items.map((item) => (
                <div key={item.id} className="field-grid todo-item-grid">
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => onUpdateItem(section.id, item.id, { checked: event.target.checked })}
                    />
                    <span>Done</span>
                  </label>
                  <label className="field todo-item-grid__text">
                    <span>Item</span>
                    <input value={item.text} onChange={(event) => onUpdateItem(section.id, item.id, { text: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Priority</span>
                    <select value={item.priority} onChange={(event) => onUpdateItem(section.id, item.id, { priority: event.target.value as TodoItem['priority'] })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <button type="button" className="ghost-button" onClick={() => onRemoveItem(section.id, item.id)}>
                    Remove
                  </button>
                </div>
              ))}

              <button type="button" className="secondary-button" onClick={() => onAddItem(section.id)}>
                Add item
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
