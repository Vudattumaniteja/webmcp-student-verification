import { getSchoolById, School } from './schoolSearch';

export type VerificationStatus =
  | 'APPROVED'
  | 'PENDING_DOCS'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED';

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
  allowedDocTypes?: string[];
  message: string;
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
  allowedDocTypes?: string[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
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

    // Fallback path: Document upload required
    const uploadUrl = `https://api.sheerid-mock.internal/v2/verification/${verificationId}/upload`;
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
      allowedDocTypes: ALLOWED_DOCUMENT_TYPES,
      message: `Personal details accepted. Upload proof of enrollment for ${school.name} to complete verification.`,
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
    if (school.instantMatchEligible) {
      return true;
    }
    const domain = email.toLowerCase().split('@')[1];
    if (domain && school.domain.toLowerCase() === domain && school.instantMatchEligible) {
      return true;
    }
    return false;
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
