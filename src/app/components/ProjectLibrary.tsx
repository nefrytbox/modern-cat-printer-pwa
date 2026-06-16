import type { DocumentMode, SavedProject } from '../../types';

interface ProjectLibraryProps {
  projects: SavedProject[];
  activeProjectId: string | null;
  onSelect: (projectId: string) => void;
  onNew: (mode?: DocumentMode) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function ProjectLibrary({
  projects,
  activeProjectId,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
  onExport,
  onImport
}: ProjectLibraryProps) {
  return (
    <section className="panel card project-library">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Local drafts</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => onNew()}>
          New
        </button>
      </div>

      <div className="project-actions">
        <button type="button" className="ghost-button" onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className="ghost-button" onClick={onExport}>
          Export JSON
        </button>
        <button type="button" className="ghost-button" onClick={onImport}>
          Import JSON
        </button>
        <button type="button" className="danger-button" onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className="project-list" role="list" aria-label="Saved projects">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            role="listitem"
            className={`project-row ${activeProjectId === project.id ? 'active' : ''}`}
            onClick={() => onSelect(project.id)}
          >
            <span className="project-row__title">{project.name}</span>
            <span className="project-row__meta">
              {project.mode} · {new Date(project.updatedAt).toLocaleString()}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
