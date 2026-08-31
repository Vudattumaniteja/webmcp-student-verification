import {
  DemoPreset,
  DemoPresetId,
  SanitizedDocumentHandle,
  SanitizedStudentProfile,
  StudentProfile,
  VaultDocument,
  VaultState,
} from '../types/vault.ts';
import { DEMO_PRESETS, createMockDocumentBlob } from './vaultPresets.ts';

export type VaultListener = (state: VaultState) => void;

const DB_NAME = 'student-vault-db';
const STORE_NAME = 'document-blobs';
const DB_VERSION = 1;

async function openVaultDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function persistBlobToDb(documentId: string, blob: Blob): Promise<void> {
  const db = await openVaultDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, documentId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function fetchBlobFromDb(documentId: string): Promise<Blob | null> {
  const db = await openVaultDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(documentId);
      req.onsuccess = () => {
        const result = req.result;
        resolve(result instanceof Blob ? result : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function deleteBlobFromDb(documentId: string): Promise<void> {
  const db = await openVaultDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(documentId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export class StudentVault {
  private activePresetId: DemoPresetId | 'CUSTOM';
  private profile: StudentProfile;
  private documents: VaultDocument[];
  private binaryStore: Map<string, Blob> = new Map();
  private listeners: Set<VaultListener> = new Set();

  constructor(initialPreset: DemoPresetId = 'STANFORD_VALID') {
    this.activePresetId = initialPreset;
    const preset = DEMO_PRESETS[initialPreset] || DEMO_PRESETS.STANFORD_VALID;
    this.profile = { ...preset.profile };
    this.documents = preset.documents.map((d) => ({ ...d }));

    // Populate binary Blobs for the preset documents and persist to IndexedDB
    this.initPresetBlobs(this.documents);
  }

  private initPresetBlobs(docs: VaultDocument[]): void {
    for (const doc of docs) {
      if (!this.binaryStore.has(doc.id)) {
        const blob = createMockDocumentBlob(doc);
        this.binaryStore.set(doc.id, blob);
        void persistBlobToDb(doc.id, blob);
      }
    }
  }

  public getState(): VaultState {
    return {
      activePresetId: this.activePresetId,
      profile: { ...this.profile },
      documents: this.documents.map((d) => ({ ...d })),
    };
  }

  public getProfile(): StudentProfile {
    return { ...this.profile };
  }

  public getSanitizedProfile(): SanitizedStudentProfile {
    return {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      fullName: this.profile.fullName,
      email: this.profile.email,
      birthDate: this.profile.birthDate,
      universityId: this.profile.universityId,
      universityName: this.profile.universityName,
      academicLevel: this.profile.academicLevel,
      graduationYear: this.profile.graduationYear,
    };
  }

  public listDocuments(): VaultDocument[] {
    return this.documents.map((d) => ({ ...d }));
  }

  /**
   * Returns sanitized metadata handles with zero raw binary data.
   * Keeps output concise (<300 chars) for WebMCP claim-check discovery.
   */
  public listSanitizedHandles(): SanitizedDocumentHandle[] {
    return this.documents.map((d) => {
      const handle: SanitizedDocumentHandle = {
        documentId: d.id,
        docType: d.docType,
        fileName: d.fileName,
        isValid: d.isValid,
      };
      if (d.expirationDate) {
        handle.expirationDate = d.expirationDate;
      }
      return handle;
    });
  }

  public getDocumentMetadata(documentId: string): VaultDocument | undefined {
    const found = this.documents.find((d) => d.id === documentId);
    return found ? { ...found } : undefined;
  }

  public async getDocumentBlob(documentId: string): Promise<Blob | null> {
    const memoryBlob = this.binaryStore.get(documentId);
    if (memoryBlob) {
      return memoryBlob;
    }
    const dbBlob = await fetchBlobFromDb(documentId);
    if (dbBlob) {
      this.binaryStore.set(documentId, dbBlob);
      return dbBlob;
    }
    return null;
  }

  public getDocumentBlobSync(documentId: string): Blob | null {
    return this.binaryStore.get(documentId) || null;
  }

  public async storeDocumentBlob(documentId: string, blob: Blob): Promise<void> {
    this.binaryStore.set(documentId, blob);
    await persistBlobToDb(documentId, blob);
  }

  public switchPreset(presetId: DemoPresetId): void {
    const targetPreset = DEMO_PRESETS[presetId];
    if (!targetPreset) {
      throw new Error(`Invalid preset ID: ${presetId}`);
    }

    this.activePresetId = presetId;
    this.profile = { ...targetPreset.profile };
    this.documents = targetPreset.documents.map((d) => ({ ...d }));
    this.initPresetBlobs(this.documents);

    this.notify();
  }

  public getActivePreset(): DemoPreset {
    if (this.activePresetId !== 'CUSTOM' && DEMO_PRESETS[this.activePresetId]) {
      return DEMO_PRESETS[this.activePresetId];
    }
    return {
      id: 'STANFORD_VALID',
      name: 'Custom Student',
      universityName: this.profile.universityName,
      tagline: 'Custom Configuration',
      badge: 'Custom',
      description: 'Customized student profile and document configuration.',
      testScenario: 'Custom verification scenario.',
      profile: this.profile,
      documents: this.documents,
    };
  }

  public getAllPresets(): DemoPreset[] {
    return Object.values(DEMO_PRESETS);
  }

  public async addCustomDocument(
    docInput: Omit<VaultDocument, 'id'>,
    blob: Blob,
  ): Promise<VaultDocument> {
    const customId = `doc_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: VaultDocument = {
      ...docInput,
      id: customId,
    };

    this.documents.push(newDoc);
    this.binaryStore.set(customId, blob);
    await persistBlobToDb(customId, blob);
    this.notify();
    return newDoc;
  }

  public removeDocument(documentId: string): boolean {
    const initialLen = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== documentId);
    this.binaryStore.delete(documentId);
    void deleteBlobFromDb(documentId);

    if (this.documents.length !== initialLen) {
      this.notify();
      return true;
    }
    return false;
  }

  public subscribe(listener: VaultListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const globalVault = new StudentVault('STANFORD_VALID');
