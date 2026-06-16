import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultDocument, createDefaultProject, getDefaultProjectName, TODO_TEMPLATES } from '../defaults';
import { resolvePrintSettings } from '../presets/qualityPresets';
import { detectPrinterCapabilities, createTransportRegistry } from '../printing/capabilities';
import { renderProjectToCanvas } from '../render/projectRenderer';
import { deleteProject, getActiveProjectId, listProjects, saveActiveProjectId, saveProject } from '../storage/projects';
import type {
  DocumentMode,
  ImageDocument,
  PrintSettingsOverride,
  PrinterCapabilities,
  PrinterStatus,
  ReceiptItem,
  ReceiptPlDocument,
  SavedProject,
  TextDocument,
  TodoDocument,
  TodoItem,
  TodoSection,
  TransportKind
} from '../types';
import { deepClone } from '../utils/clone';
import { formatDateTime } from '../utils/format';
import { createId } from '../utils/id';
import { ActivityPanel } from './components/ActivityPanel';
import { ModeSwitcher } from './components/ModeSwitcher';
import { PreviewPanel } from './components/PreviewPanel';
import { PrinterPanel } from './components/PrinterPanel';
import { ProjectLibrary } from './components/ProjectLibrary';
import { QualityPanel } from './components/QualityPanel';
import { ImageEditor } from './editors/ImageEditor';
import { ReceiptEditor } from './editors/ReceiptEditor';
import { TextEditor } from './editors/TextEditor';
import { TodoEditor } from './editors/TodoEditor';

type ActivityEntry = {
  id: string;
  message: string;
};

const THEME_STORAGE_KEY = 'catprinter-theme';

export default function App() {
  const transportsRef = useRef(createTransportRegistry());
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [previewPending, setPreviewPending] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<PrinterCapabilities | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportKind>('mock');
  const [connectedTransport, setConnectedTransport] = useState<TransportKind | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(null);
  const [busy, setBusy] = useState<'connect' | 'print' | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null,
    [activeProjectId, projects]
  );

  const resolvedSettings = useMemo(
    () => (activeProject ? resolvePrintSettings(activeProject.qualityPresetId, activeProject.printSettings) : null),
    [activeProject]
  );

  const appendActivity = useCallback((message: string) => {
    const entry: ActivityEntry = {
      id: createId('activity'),
      message: `${new Date().toLocaleTimeString()} · ${message}`
    };
    setActivity((current) => [entry, ...current].slice(0, 20));
  }, []);

  const refreshCapabilities = useCallback(async () => {
    const nextCapabilities = await detectPrinterCapabilities(transportsRef.current);
    setCapabilities(nextCapabilities);
  }, []);

  useEffect(() => {
    void (async () => {
      const [storedProjects, storedActiveProjectId] = await Promise.all([listProjects(), getActiveProjectId()]);
      if (storedProjects.length > 0) {
        setProjects(storedProjects);
        setActiveProjectId(storedActiveProjectId ?? storedProjects[0].id);
      } else {
        const project = createDefaultProject('receipt-pl');
        setProjects([project]);
        setActiveProjectId(project.id);
        await saveProject(project);
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    void refreshCapabilities();
  }, [refreshCapabilities]);

  useEffect(() => {
    if (!capabilities) {
      return;
    }

    const supportedKinds = new Set(capabilities.transports.filter((transport) => transport.supported).map((transport) => transport.kind));
    if (!supportedKinds.has(selectedTransport)) {
      setSelectedTransport(capabilities.recommendedKind);
    }
  }, [capabilities, selectedTransport]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .then(() => {
          setOfflineReady(true);
          appendActivity('Offline cache ready. The editor shell now works without internet.');
        })
        .catch((error) => {
          appendActivity(`Service worker registration warning: ${String(error)}`);
        });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, [appendActivity]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated || !activeProjectId) {
      return;
    }
    void saveActiveProjectId(activeProjectId);
  }, [activeProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated || !activeProject) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveProject(activeProject);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [activeProject, hydrated]);

  useEffect(() => {
    if (!activeProject || !resolvedSettings) {
      return;
    }

    let cancelled = false;
    setPreviewPending(true);
    setPreviewError(null);

    void renderProjectToCanvas(activeProject, resolvedSettings)
      .then((canvas) => {
        if (cancelled) {
          return;
        }
        setPreviewCanvas(canvas);
        setPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }
        setPreviewError(error.message);
        appendActivity(`Preview error: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject, appendActivity, resolvedSettings]);

  const updateActiveProject = useCallback(
    (updater: (project: SavedProject) => SavedProject) => {
      if (!activeProjectId) {
        return;
      }

      setProjects((current) =>
        current.map((project) =>
          project.id === activeProjectId
            ? {
                ...updater(project),
                updatedAt: new Date().toISOString()
              }
            : project
        )
      );
    },
    [activeProjectId]
  );

  const handleNewProject = useCallback(
    async (mode?: DocumentMode) => {
      const project = createDefaultProject(mode ?? activeProject?.mode ?? 'receipt-pl');
      setProjects((current) => [project, ...current]);
      setActiveProjectId(project.id);
      await saveProject(project);
      appendActivity(`Created a new ${project.mode} draft.`);
    },
    [activeProject?.mode, appendActivity]
  );

  const handleDuplicateProject = useCallback(async () => {
    if (!activeProject) {
      return;
    }

    const duplicate = deepClone(activeProject);
    duplicate.id = createId('project');
    duplicate.name = `${activeProject.name} Copy`;
    duplicate.updatedAt = new Date().toISOString();

    setProjects((current) => [duplicate, ...current]);
    setActiveProjectId(duplicate.id);
    await saveProject(duplicate);
    appendActivity(`Duplicated "${activeProject.name}".`);
  }, [activeProject, appendActivity]);

  const handleDeleteProject = useCallback(async () => {
    if (!activeProject) {
      return;
    }

    await deleteProject(activeProject.id);
    const remaining = projects.filter((project) => project.id !== activeProject.id);
    if (remaining.length > 0) {
      setProjects(remaining);
      setActiveProjectId(remaining[0].id);
    } else {
      const replacement = createDefaultProject(activeProject.mode);
      setProjects([replacement]);
      setActiveProjectId(replacement.id);
      await saveProject(replacement);
    }
    appendActivity(`Deleted "${activeProject.name}".`);
  }, [activeProject, appendActivity, projects]);

  const handleExportProject = useCallback(() => {
    if (!activeProject) {
      return;
    }

    const blob = new Blob([JSON.stringify(activeProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    appendActivity(`Exported "${activeProject.name}" to JSON.`);
  }, [activeProject, appendActivity]);

  const handleImportFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }

      const payload = await file.text();
      const parsed = JSON.parse(payload) as SavedProject;
      const importedProject = {
        ...parsed,
        id: createId('project'),
        updatedAt: new Date().toISOString()
      } satisfies SavedProject;

      setProjects((current) => [importedProject, ...current]);
      setActiveProjectId(importedProject.id);
      await saveProject(importedProject);
      appendActivity(`Imported "${importedProject.name}".`);
    },
    [appendActivity]
  );

  const handleModeSelect = useCallback(
    (mode: DocumentMode) => {
      updateActiveProject((project) => ({
        ...project,
        mode,
        name: getDefaultProjectName(mode),
        document: createDefaultDocument(mode)
      }));
      appendActivity(`Switched editor to ${mode}.`);
    },
    [appendActivity, updateActiveProject]
  );

  const updatePrintOverrides = useCallback(
    (changes: PrintSettingsOverride) => {
      updateActiveProject((project) => ({
        ...project,
        printSettings: Object.keys(changes).length === 0 ? {} : { ...project.printSettings, ...changes }
      }));
    },
    [updateActiveProject]
  );

  const ensureTransportConnected = useCallback(
    async (kind: TransportKind) => {
      if (kind === 'unavailable') {
        throw new Error('No printer transport is available.');
      }

      const transport = transportsRef.current[kind as 'web-bluetooth' | 'native-bridge' | 'mock'];
      const supported = await transport.isSupported();
      if (!supported) {
        throw new Error(`${transport.label} is not supported in this environment.`);
      }

      if (connectedTransport && connectedTransport !== kind) {
        await transportsRef.current[connectedTransport as 'web-bluetooth' | 'native-bridge' | 'mock'].disconnect();
      }

      await transport.connect();
      setConnectedTransport(kind);
      const status = await transport.getStatus();
      setPrinterStatus(status);
      return transport;
    },
    [connectedTransport]
  );

  const handleConnect = useCallback(async () => {
    setBusy('connect');
    try {
      const transport = await ensureTransportConnected(selectedTransport);
      appendActivity(`Connected via ${transport.label}.`);
      await refreshCapabilities();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed.';
      setPrinterStatus({
        connected: false,
        batteryLevel: null,
        transport: selectedTransport,
        message
      });
      appendActivity(`Connection error: ${message}`);
    } finally {
      setBusy(null);
    }
  }, [appendActivity, ensureTransportConnected, refreshCapabilities, selectedTransport]);

  const handleDisconnect = useCallback(async () => {
    if (!connectedTransport) {
      return;
    }

    await transportsRef.current[connectedTransport as 'web-bluetooth' | 'native-bridge' | 'mock'].disconnect();
    setConnectedTransport(null);
    setPrinterStatus({
      connected: false,
      batteryLevel: null,
      transport: selectedTransport,
      message: 'Transport disconnected.'
    });
    appendActivity('Disconnected from printer.');
  }, [appendActivity, connectedTransport, selectedTransport]);

  const handlePrint = useCallback(async () => {
    if (!activeProject || !resolvedSettings || !previewCanvas) {
      return;
    }

    setBusy('print');
    try {
      const transport = await ensureTransportConnected(selectedTransport);
      const result = await transport.printBitmap({
        canvas: previewCanvas,
        settings: resolvedSettings,
        title: activeProject.name
      });
      setPrinterStatus(await transport.getStatus());
      appendActivity(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print failed.';
      appendActivity(`Print error: ${message}`);
      setPrinterStatus({
        connected: connectedTransport === selectedTransport,
        batteryLevel: printerStatus?.batteryLevel ?? null,
        transport: selectedTransport,
        message
      });
    } finally {
      setBusy(null);
    }
  }, [
    activeProject,
    appendActivity,
    connectedTransport,
    ensureTransportConnected,
    previewCanvas,
    printerStatus?.batteryLevel,
    resolvedSettings,
    selectedTransport
  ]);

  const handleImageFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      updateActiveProject((project) => ({
        ...project,
        document: {
          ...(project.document as ImageDocument),
          imageDataUrl: dataUrl,
          title: file.name
        }
      }));
      appendActivity(`Loaded image "${file.name}" into the current draft.`);
    },
    [appendActivity, updateActiveProject]
  );

  const renderEditor = () => {
    if (!activeProject) {
      return null;
    }

    if (activeProject.mode === 'receipt-pl') {
      const document = activeProject.document as ReceiptPlDocument;
      return (
        <ReceiptEditor
          document={document}
          onChange={(changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as ReceiptPlDocument),
                ...changes
              }
            }))
          }
          onAddItem={() =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as ReceiptPlDocument),
                items: [
                  ...(project.document as ReceiptPlDocument).items,
                  {
                    id: createId('receipt-item'),
                    name: 'New product',
                    quantity: 1,
                    unit: 'szt',
                    unitPrice: 0,
                    vatRate: 'A 23%'
                  }
                ]
              }
            }))
          }
          onUpdateItem={(itemId, changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as ReceiptPlDocument),
                items: (project.document as ReceiptPlDocument).items.map((item) =>
                  item.id === itemId ? ({ ...item, ...changes } as ReceiptItem) : item
                )
              }
            }))
          }
          onRemoveItem={(itemId) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as ReceiptPlDocument),
                items: (project.document as ReceiptPlDocument).items.filter((item) => item.id !== itemId)
              }
            }))
          }
        />
      );
    }

    if (activeProject.mode === 'todo') {
      const document = activeProject.document as TodoDocument;
      return (
        <TodoEditor
          document={document}
          onChange={(changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                ...changes
              }
            }))
          }
          onApplyTemplate={(templateKey) =>
            updateActiveProject((project) => ({
              ...project,
              document: deepClone(TODO_TEMPLATES[templateKey] ?? TODO_TEMPLATES.shopping)
            }))
          }
          onAddSection={() =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: [
                  ...(project.document as TodoDocument).sections,
                  {
                    id: createId('todo-section'),
                    title: 'New section',
                    items: []
                  }
                ]
              }
            }))
          }
          onUpdateSection={(sectionId, changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: (project.document as TodoDocument).sections.map((section) =>
                  section.id === sectionId ? ({ ...section, ...changes } as TodoSection) : section
                )
              }
            }))
          }
          onRemoveSection={(sectionId) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: (project.document as TodoDocument).sections.filter((section) => section.id !== sectionId)
              }
            }))
          }
          onAddItem={(sectionId) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: (project.document as TodoDocument).sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        items: [
                          ...section.items,
                          {
                            id: createId('todo-item'),
                            text: 'New task',
                            checked: false,
                            priority: 'medium'
                          }
                        ]
                      }
                    : section
                )
              }
            }))
          }
          onUpdateItem={(sectionId, itemId, changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: (project.document as TodoDocument).sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        items: section.items.map((item) =>
                          item.id === itemId ? ({ ...item, ...changes } as TodoItem) : item
                        )
                      }
                    : section
                )
              }
            }))
          }
          onRemoveItem={(sectionId, itemId) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TodoDocument),
                sections: (project.document as TodoDocument).sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        items: section.items.filter((item) => item.id !== itemId)
                      }
                    : section
                )
              }
            }))
          }
        />
      );
    }

    if (activeProject.mode === 'text') {
      return (
        <TextEditor
          document={activeProject.document as TextDocument}
          onChange={(changes) =>
            updateActiveProject((project) => ({
              ...project,
              document: {
                ...(project.document as TextDocument),
                ...changes
              }
            }))
          }
        />
      );
    }

    return (
      <ImageEditor
        document={activeProject.document as ImageDocument}
        onChange={(changes) =>
          updateActiveProject((project) => ({
            ...project,
            document: {
              ...(project.document as ImageDocument),
              ...changes
            }
          }))
        }
        onImageSelect={(file) => void handleImageFile(file)}
      />
    );
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Offline-first print studio</p>
          <h1>Modern Cat Printer PWA</h1>
          <p className="header-copy">
            Receipt, TO-DO, text, and graphic layouts for Cat Printer / MXW01, with honest iOS Bluetooth capability messaging.
          </p>
        </div>

        <div className="header-actions">
          <span className={`status-pill ${isOnline ? 'success' : 'warning'}`}>{isOnline ? 'Online' : 'Offline mode'}</span>
          <button type="button" className="secondary-button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            Theme: {theme}
          </button>
          {activeProject ? (
            <label className="checkbox-field compact">
              <input
                type="checkbox"
                checked={activeProject.layoutSettings.showRuler}
                onChange={(event) =>
                  updateActiveProject((project) => ({
                    ...project,
                    layoutSettings: {
                      ...project.layoutSettings,
                      showRuler: event.target.checked
                    }
                  }))
                }
              />
              <span>Show ruler</span>
            </label>
          ) : null}
        </div>
      </header>

      <main className="workspace-grid">
        <aside className="sidebar-column">
          <ProjectLibrary
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={setActiveProjectId}
            onNew={(mode) => void handleNewProject(mode)}
            onDuplicate={() => void handleDuplicateProject()}
            onDelete={() => void handleDeleteProject()}
            onExport={handleExportProject}
            onImport={() => importInputRef.current?.click()}
          />
          <PrinterPanel
            capabilities={capabilities}
            selectedTransport={selectedTransport}
            printerStatus={printerStatus}
            connectedTransport={connectedTransport}
            busy={busy}
            onTransportChange={setSelectedTransport}
            onConnect={() => void handleConnect()}
            onDisconnect={() => void handleDisconnect()}
            onPrint={() => void handlePrint()}
          />
          <ActivityPanel activity={activity} />
        </aside>

        <section className="editor-column">
          {activeProject ? (
            <>
              <div className="card editor-card">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Active project</p>
                    <h2>{activeProject.name}</h2>
                  </div>
                </div>

                <div className="field-grid two-up">
                  <label className="field">
                    <span>Project name</span>
                    <input
                      value={activeProject.name}
                      onChange={(event) =>
                        updateActiveProject((project) => ({
                          ...project,
                          name: event.target.value
                        }))
                      }
                    />
                  </label>
                  {activeProject.mode === 'receipt-pl' ? (
                    <button
                      type="button"
                      className="secondary-button align-end"
                      onClick={() =>
                        updateActiveProject((project) => ({
                          ...project,
                          document: {
                            ...(project.document as ReceiptPlDocument),
                            dateTime: formatDateTime()
                          }
                        }))
                      }
                    >
                      Use current time
                    </button>
                  ) : null}
                </div>
              </div>

              <ModeSwitcher activeMode={activeProject.mode} onSelect={handleModeSelect} />
              {renderEditor()}
            </>
          ) : null}
        </section>

        <aside className="preview-column">
          {activeProject && resolvedSettings ? (
            <>
              <PreviewPanel
                previewUrl={previewUrl}
                isRendering={previewPending}
                showRuler={activeProject.layoutSettings.showRuler}
                disclaimer={
                  previewError ??
                  (activeProject.mode === 'receipt-pl'
                    ? (activeProject.document as ReceiptPlDocument).disclaimer
                    : 'Preview matches the bitmap pipeline used for printing and offline export.')
                }
                offlineReady={offlineReady}
                activePresetLabel={resolvedSettings.label}
              />
              <QualityPanel
                presetId={activeProject.qualityPresetId}
                resolvedSettings={resolvedSettings}
                overrides={activeProject.printSettings}
                onPresetChange={(presetId) =>
                  updateActiveProject((project) => ({
                    ...project,
                    qualityPresetId: presetId
                  }))
                }
                onOverrideChange={updatePrintOverrides}
              />
            </>
          ) : null}
        </aside>
      </main>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="visually-hidden"
        onChange={(event) => {
          void handleImportFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}
