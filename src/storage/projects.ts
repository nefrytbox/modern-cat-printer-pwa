import type { SavedProject } from '../types';

const DB_NAME = 'modern-cat-printer';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const META_STORE = 'meta';
const FALLBACK_PROJECTS_KEY = 'catprinter-projects';
const FALLBACK_ACTIVE_ID_KEY = 'catprinter-active-project-id';

type MetaRecord = { key: string; value: string };

function supportsIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

function readFallbackProjects(): SavedProject[] {
  const raw = localStorage.getItem(FALLBACK_PROJECTS_KEY);
  return raw ? (JSON.parse(raw) as SavedProject[]) : [];
}

function writeFallbackProjects(projects: SavedProject[]): void {
  localStorage.setItem(FALLBACK_PROJECTS_KEY, JSON.stringify(projects));
}

export async function listProjects(): Promise<SavedProject[]> {
  if (!supportsIndexedDb()) {
    return readFallbackProjects().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECTS_STORE, 'readonly');
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.getAll();
    request.onerror = () => reject(request.error ?? new Error('Failed to load projects.'));
    request.onsuccess = () => {
      const projects = (request.result as SavedProject[]).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      resolve(projects);
    };
    transaction.oncomplete = () => database.close();
  });
}

export async function saveProject(project: SavedProject): Promise<void> {
  if (!supportsIndexedDb()) {
    const projects = readFallbackProjects();
    const nextProjects = [...projects.filter((entry) => entry.id !== project.id), project];
    writeFallbackProjects(nextProjects);
    return;
  }

  await withStore(PROJECTS_STORE, 'readwrite', (store) => store.put(project));
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!supportsIndexedDb()) {
    const nextProjects = readFallbackProjects().filter((entry) => entry.id !== projectId);
    writeFallbackProjects(nextProjects);
    return;
  }

  await withStore(PROJECTS_STORE, 'readwrite', (store) => store.delete(projectId));
}

export async function saveActiveProjectId(projectId: string): Promise<void> {
  if (!supportsIndexedDb()) {
    localStorage.setItem(FALLBACK_ACTIVE_ID_KEY, projectId);
    return;
  }

  await withStore(META_STORE, 'readwrite', (store) => store.put({ key: 'active-project-id', value: projectId } satisfies MetaRecord));
}

export async function getActiveProjectId(): Promise<string | null> {
  if (!supportsIndexedDb()) {
    return localStorage.getItem(FALLBACK_ACTIVE_ID_KEY);
  }

  const record = await withStore<MetaRecord | undefined>(META_STORE, 'readonly', (store) => store.get('active-project-id'));
  return record?.value ?? null;
}
