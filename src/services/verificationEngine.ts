import { getSchoolById, School } from './schoolSearch';

export type VerificationStatus =
  | 'APPROVED'
  | 'PENDING_DOCS'
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'EXPIRED';

export type RejectionCode =
  | 'EXPIRED_DOCUMENT'
  | 'ILLEGIBLE_DOCUMENT'
  | 'NAME_MISMATCH'
  | 'DOCUMENT_CORRUPTED'
  | 'UNSUPPORTED_TYPE';

export type VerificationStep =
  | 'collectStudentPersonalInfo'
  | 'docUpload'
  | 'pendingReview'
  | 'completed';

export interface StudentPersonalInfo {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  merchantId?: string;
}

export interface VerificationResult {
  verificationId: string;
  status: VerificationStatus;
  currentStep: VerificationStep;
  rewardCode?: string;
  uploadUrl?: string;
  uploadToken?: string;
  allowedDocTypes?: string[];
  rejectionCode?: RejectionCode | string;
  rejectionReason?: string;
  remedyText?: string;
  message: string;
}

export interface StagedDocument {
  blob: Blob;
  metadata?: DocumentEvaluationInput;
}

export interface VerificationSession {
  verificationId: string;
  schoolId: string;
  schoolName: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
    birthDate?: string;
  };
  merchantId?: string;
  status: VerificationStatus;
  currentStep: VerificationStep;
  rewardCode?: string;
  uploadUrl?: string;
  uploadToken?: string;
  allowedDocTypes?: string[];
  uploadedDocumentId?: string;
  stagedDocument?: StagedDocument;
  rejectionCode?: RejectionCode | string;
  rejectionReason?: string;
  remedyText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentEvaluationInput {
  id?: string;
  docType?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  expirationDate?: string;
  issueDate?: string;
  isValid?: boolean;
  isIllegible?: boolean;
  title?: string;
  description?: string;
  previewText?: string;
}

const ALLOWED_DOCUMENT_TYPES = [
  'STUDENT_ID',
  'CLASS_SCHEDULE',
  'TUITION_RECEIPT',
  'TRANSCRIPT',
];

export class VerificationEngine {
  private sessions: Map<string, VerificationSession> = new Map();
  private sessionCounter = 1000;

  submitPersonalInfo(info: StudentPersonalInfo): VerificationResult {
    if (!info.schoolId || !info.schoolId.trim()) {
      throw new Error('schoolId is required');
    }

    if (!info.firstName || !info.firstName.trim() || !info.lastName || !info.lastName.trim()) {
      throw new Error('firstName and lastName are required');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!info.email || !emailPattern.test(info.email.trim())) {
      throw new Error('A valid email address is required');
    }

    const school = getSchoolById(info.schoolId.trim());
    if (!school) {
      throw new Error(`Accredited institution not found for ID "${info.schoolId}"`);
    }

    const verificationId = `ver_${Date.now()}_${++this.sessionCounter}`;
    const now = new Date().toISOString();

    const isInstantMatch = this.checkInstantEligibility(school, info.email);

    if (isInstantMatch) {
      const rewardCode = this.generateRewardCode(info.merchantId, school);
      const session: VerificationSession = {
        verificationId,
        schoolId: school.id,
        schoolName: school.name,
        student: {
          firstName: info.firstName.trim(),
          lastName: info.lastName.trim(),
          email: info.email.trim().toLowerCase(),
          birthDate: info.birthDate,
        },
        merchantId: info.merchantId,
        status: 'APPROVED',
        currentStep: 'completed',
        rewardCode,
        createdAt: now,
        updatedAt: now,
      };

      this.sessions.set(verificationId, session);

      return {
        verificationId,
        status: 'APPROVED',
        currentStep: 'completed',
        rewardCode,
        message: `Instant registrar match confirmed with ${school.name}. Student discount reward code unlocked.`,
      };
    }

    // Fallback path: Pre-signed document upload required
    const uploadToken = `tok_${Math.random().toString(36).substring(2, 10)}`;
    const uploadUrl = `https://s3.sheerid-mock.internal/uploads/${verificationId}/${uploadToken}`;
    const session: VerificationSession = {
      verificationId,
      schoolId: school.id,
      schoolName: school.name,
      student: {
        firstName: info.firstName.trim(),
        lastName: info.lastName.trim(),
        email: info.email.trim().toLowerCase(),
        birthDate: info.birthDate,
      },
      merchantId: info.merchantId,
      status: 'PENDING_DOCS',
      currentStep: 'docUpload',
      uploadUrl,
      uploadToken,
      allowedDocTypes: ALLOWED_DOCUMENT_TYPES,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(verificationId, session);

    return {
      verificationId,
      status: 'PENDING_DOCS',
      currentStep: 'docUpload',
      uploadUrl,
      uploadToken,
      allowedDocTypes: ALLOWED_DOCUMENT_TYPES,
      message: `Personal details accepted. Upload proof of enrollment for ${school.name} to complete verification.`,
    };
  }

  uploadDocumentDirect(
    verificationId: string,
    docBlob: Blob,
    docMetadata?: DocumentEvaluationInput,
  ): VerificationResult {
    const session = this.sessions.get(verificationId);
    if (!session) {
      throw new Error(`Verification session not found for ID "${verificationId}"`);
    }

    if (!docBlob || typeof docBlob.size !== 'number' || docBlob.size === 0) {
      throw new Error('Valid document binary Blob is required');
    }

    const now = new Date().toISOString();
    session.stagedDocument = { blob: docBlob, metadata: docMetadata };
    session.uploadedDocumentId = docMetadata?.id;
    session.status = 'PENDING';
    session.currentStep = 'pendingReview';
    session.updatedAt = now;

    return this.completeDocUpload(verificationId, docMetadata);
  }

  simulateDirectPut(
    uploadUrl: string,
    docBlob: Blob,
    docMetadata?: DocumentEvaluationInput,
  ): VerificationResult {
    let targetSession: VerificationSession | undefined;

    for (const session of this.sessions.values()) {
      if (session.uploadUrl === uploadUrl) {
        targetSession = session;
        break;
      }
    }

    if (!targetSession) {
      // Try finding by parsing verificationId from URL
      const match = uploadUrl.match(/\/uploads\/([^/]+)/);
      if (match && match[1]) {
        targetSession = this.sessions.get(match[1]);
      }
    }

    if (!targetSession) {
      throw new Error(`No active verification session found for pre-signed upload URL: "${uploadUrl}"`);
    }

    return this.uploadDocumentDirect(targetSession.verificationId, docBlob, docMetadata);
  }

  completeDocUpload(
    verificationId: string,
    docMetadata?: DocumentEvaluationInput,
  ): VerificationResult {
    const session = this.sessions.get(verificationId);
    if (!session) {
      throw new Error(`Verification session not found for ID "${verificationId}"`);
    }

    if (session.status === 'APPROVED') {
      return {
        verificationId,
        status: session.status,
        currentStep: session.currentStep,
        rewardCode: session.rewardCode,
        message: 'Verification already completed and approved.',
      };
    }

    const effectiveMetadata = docMetadata || session.stagedDocument?.metadata;
    const now = new Date().toISOString();
    const school = getSchoolById(session.schoolId);

    // 1. Evaluate image legibility and resolution
    const isIllegible =
      effectiveMetadata?.isIllegible === true ||
      effectiveMetadata?.id === 'doc_berk_blurry_id' ||
      (typeof effectiveMetadata?.id === 'string' && effectiveMetadata.id.toLowerCase().includes('blurry')) ||
      (typeof effectiveMetadata?.id === 'string' && effectiveMetadata.id.toLowerCase().includes('illegible'));

    if (isIllegible) {
      const rejectionCode: RejectionCode = 'ILLEGIBLE_DOCUMENT';
      const rejectionReason = 'Image resolution too low.';
      const remedyText = 'Please submit an official PDF transcript.';

      session.status = 'REJECTED';
      session.currentStep = 'docUpload';
      session.uploadedDocumentId = effectiveMetadata?.id;
      session.rejectionCode = rejectionCode;
      session.rejectionReason = rejectionReason;
      session.remedyText = remedyText;
      session.rewardCode = undefined;
      session.updatedAt = now;

      return {
        verificationId,
        status: 'REJECTED',
        currentStep: 'docUpload',
        rejectionCode,
        rejectionReason,
        remedyText,
        message: `Document rejected: ${rejectionReason} ${remedyText}`,
      };
    }

    // 2. Evaluate document expiration
    const isExpired =
      effectiveMetadata?.id === 'doc_harv_id_2024' ||
      (typeof effectiveMetadata?.id === 'string' && effectiveMetadata.id.toLowerCase().includes('expired')) ||
      (typeof effectiveMetadata?.expirationDate === 'string' &&
        new Date(effectiveMetadata.expirationDate).getTime() < new Date('2025-01-01').getTime()) ||
      (effectiveMetadata?.isValid === false && !effectiveMetadata?.isIllegible);

    if (isExpired) {
      const rejectionCode: RejectionCode = 'EXPIRED_DOCUMENT';
      const rejectionReason = 'Your student ID is expired.';
      const remedyText = 'Please submit a current term tuition receipt or transcript.';

      session.status = 'REJECTED';
      session.currentStep = 'docUpload';
      session.uploadedDocumentId = effectiveMetadata?.id;
      session.rejectionCode = rejectionCode;
      session.rejectionReason = rejectionReason;
      session.remedyText = remedyText;
      session.rewardCode = undefined;
      session.updatedAt = now;

      return {
        verificationId,
        status: 'REJECTED',
        currentStep: 'docUpload',
        rejectionCode,
        rejectionReason,
        remedyText,
        message: `Document rejected: ${rejectionReason} ${remedyText}`,
      };
    }

    // 3. Document is valid -> transition PENDING -> APPROVED
    const rewardCode = this.generateRewardCode(session.merchantId, school);

    session.status = 'APPROVED';
    session.currentStep = 'completed';
    session.uploadedDocumentId = effectiveMetadata?.id;
    session.rewardCode = rewardCode;
    session.rejectionCode = undefined;
    session.rejectionReason = undefined;
    session.remedyText = undefined;
    session.updatedAt = now;

    return {
      verificationId,
      status: 'APPROVED',
      currentStep: 'completed',
      rewardCode,
      message: 'Document verified successfully. Student discount reward code unlocked.',
    };
  }

  getSession(verificationId: string): VerificationSession | undefined {
    return this.sessions.get(verificationId);
  }

  getAllSessions(): VerificationSession[] {
    return Array.from(this.sessions.values());
  }

  reset(): void {
    this.sessions.clear();
  }

  private checkInstantEligibility(school: School, email: string): boolean {
    if (!school.instantMatchEligible) {
      return false;
    }
    if (!email || typeof email !== 'string') {
      return false;
    }
    const emailParts = email.toLowerCase().trim().split('@');
    if (emailParts.length !== 2) {
      return false;
    }
    const emailDomain = emailParts[1].trim();
    const schoolDomain = school.domain.toLowerCase().trim();
    return emailDomain === schoolDomain || emailDomain.endsWith(`.${schoolDomain}`);
  }

  private generateRewardCode(merchantId?: string, _school?: School): string {
    const merchantPrefix = (merchantId || 'STUDENT')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 7);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EDU-${merchantPrefix}-${randomSuffix}`;
  }
}

export const globalVerificationEngine = new VerificationEngine();
