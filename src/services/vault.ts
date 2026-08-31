import {
  DemoPreset,
  DemoPresetId,
  SanitizedDocumentHandle,
  StudentProfile,
  VaultDocument,
  VaultState,
} from '../types/vault.ts';
import { DEMO_PRESETS, createMockDocumentBlob } from './vaultPresets.ts';

export type VaultListener = (state: VaultState) => void;

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

    // Populate binary Blobs for the preset documents
    this.initPresetBlobs(this.documents);
  }

  private initPresetBlobs(docs: VaultDocument[]): void {
    for (const doc of docs) {
      if (!this.binaryStore.has(doc.id)) {
        this.binaryStore.set(doc.id, createMockDocumentBlob(doc));
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

  public getSanitizedProfile(): Record<string, any> {
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
    return this.binaryStore.get(documentId) || null;
  }

  public getDocumentBlobSync(documentId: string): Blob | null {
    return this.binaryStore.get(documentId) || null;
  }

  public async storeDocumentBlob(documentId: string, blob: Blob): Promise<void> {
    this.binaryStore.set(documentId, blob);
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
    this.notify();
    return newDoc;
  }

  public removeDocument(documentId: string): boolean {
    const initialLen = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== documentId);
    this.binaryStore.delete(documentId);

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
