export type DemoPresetId =
  | 'STANFORD_VALID'
  | 'HARVARD_EXPIRED'
  | 'BERKELEY_ILLEGIBLE'
  | 'MIT_INSTANT';

export type DocumentType =
  | 'STUDENT_ID'
  | 'CLASS_SCHEDULE'
  | 'TUITION_RECEIPT'
  | 'TRANSCRIPT';

export type AcademicLevel = 'UNDERGRADUATE' | 'GRADUATE' | 'POSTGRADUATE';

export interface StudentProfile {
  presetId: DemoPresetId | 'CUSTOM';
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  birthDate: string; // YYYY-MM-DD
  universityId: string;
  universityName: string;
  academicLevel: AcademicLevel;
  graduationYear: number;
  studentIdNumber?: string;
}

export interface VaultDocument {
  id: string; // Handle ID, e.g. "doc_stan_id_2026"
  fileName: string;
  docType: DocumentType;
  mimeType: string;
  fileSizeBytes: number;
  issueDate: string; // YYYY-MM-DD
  expirationDate?: string; // YYYY-MM-DD
  isValid: boolean;
  isIllegible?: boolean;
  title: string;
  description?: string;
  previewText?: string;
}

export interface SanitizedDocumentHandle {
  documentId: string;
  docType: DocumentType;
  fileName: string;
  isValid: boolean;
  expirationDate?: string;
}

export interface DemoPreset {
  id: DemoPresetId;
  name: string;
  universityName: string;
  tagline: string;
  badge: string;
  description: string;
  testScenario: string;
  profile: StudentProfile;
  documents: VaultDocument[];
}

export interface VaultState {
  activePresetId: DemoPresetId | 'CUSTOM';
  profile: StudentProfile;
  documents: VaultDocument[];
}

export interface WebMCPToolAnnotation {
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
}

export interface WebMCPToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  annotations: WebMCPToolAnnotation;
  execute: (input: any) => Promise<string>;
}
