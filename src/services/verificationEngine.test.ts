import { describe, it, expect, beforeEach } from 'vitest';
import { VerificationEngine } from './verificationEngine';

describe('Verification Provider Engine', () => {
  let engine: VerificationEngine;

  beforeEach(() => {
    engine = new VerificationEngine();
  });

  describe('collectStudentPersonalInfo - Instant Match', () => {
    it('should instantly approve MIT students (registrar match) and issue a reward code', () => {
      const result = engine.submitPersonalInfo({
        schoolId: 'sch_mit_001',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex.rivera@mit.edu',
        birthDate: '2001-04-12',
        merchantId: 'chatgpt_plus',
      });

      expect(result.verificationId).toBeDefined();
      expect(result.verificationId).toMatch(/^ver_/);
      expect(result.status).toBe('APPROVED');
      expect(result.currentStep).toBe('completed');
      expect(result.rewardCode).toBeDefined();
      expect(result.rewardCode).toMatch(/^EDU-/);
      expect(result.message).toContain('Instant');

      const session = engine.getSession(result.verificationId);
      expect(session).toBeDefined();
      expect(session?.status).toBe('APPROVED');
      expect(session?.rewardCode).toBe(result.rewardCode);
    });

    it('should generate distinct reward codes for different merchant offers', () => {
      const resultSpotify = engine.submitPersonalInfo({
        schoolId: 'sch_mit_001',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena@mit.edu',
        merchantId: 'spotify_premium',
      });

      const resultAws = engine.submitPersonalInfo({
        schoolId: 'sch_mit_001',
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'marcus@mit.edu',
        merchantId: 'aws_educate',
      });

      expect(resultSpotify.rewardCode).toBeDefined();
      expect(resultAws.rewardCode).toBeDefined();
      expect(resultSpotify.rewardCode).not.toBe(resultAws.rewardCode);
      expect(resultSpotify.rewardCode).toContain('SPOTIFY');
      expect(resultAws.rewardCode).toContain('AWS');
    });
  });

  describe('collectStudentPersonalInfo - Document Fallback', () => {
    it('should require docUpload for Stanford students without instant match and generate pre-signed upload URL', () => {
      const result = engine.submitPersonalInfo({
        schoolId: 'sch_stanford_002',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'schen@stanford.edu',
        birthDate: '2003-09-15',
        merchantId: 'spotify_premium',
      });

      expect(result.verificationId).toBeDefined();
      expect(result.status).toBe('PENDING_DOCS');
      expect(result.currentStep).toBe('docUpload');
      expect(result.rewardCode).toBeUndefined();
      expect(result.uploadUrl).toBeDefined();
      expect(result.uploadUrl).toMatch(/^https:\/\/s3\.sheerid-mock\.internal\/uploads\/ver_/);
      expect(result.uploadUrl).toContain(result.verificationId);
      expect(result.allowedDocTypes).toContain('STUDENT_ID');
      expect(result.allowedDocTypes).toContain('TUITION_RECEIPT');

      const session = engine.getSession(result.verificationId);
      expect(session).toBeDefined();
      expect(session?.status).toBe('PENDING_DOCS');
      expect(session?.currentStep).toBe('docUpload');
      expect(session?.uploadUrl).toBe(result.uploadUrl);
    });

    it('should require docUpload for Harvard and Berkeley students', () => {
      const harvardResult = engine.submitPersonalInfo({
        schoolId: 'sch_harvard_003',
        firstName: 'David',
        lastName: 'Kim',
        email: 'dkim@harvard.edu',
      });
      expect(harvardResult.status).toBe('PENDING_DOCS');
      expect(harvardResult.currentStep).toBe('docUpload');

      const berkeleyResult = engine.submitPersonalInfo({
        schoolId: 'sch_berkeley_004',
        firstName: 'Maya',
        lastName: 'Lin',
        email: 'mlin@berkeley.edu',
      });
      expect(berkeleyResult.status).toBe('PENDING_DOCS');
      expect(berkeleyResult.currentStep).toBe('docUpload');
    });
  });

  describe('Document Upload & Evaluation Lifecycle', () => {
    it('should successfully evaluate and approve a valid document upload', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_stanford_002',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@stanford.edu',
        merchantId: 'spotify_premium',
      });

      const mockBlob = new Blob(['VALID_STANFORD_STUDENT_ID_DATA'], { type: 'image/png' });
      const uploadResult = engine.uploadDocumentDirect(init.verificationId, mockBlob, {
        id: 'doc_stan_id_2026',
        docType: 'STUDENT_ID',
        fileName: 'stanford_id_2026.png',
        expirationDate: '2026-06-30',
        isValid: true,
        isIllegible: false,
      });

      expect(uploadResult.verificationId).toBe(init.verificationId);
      expect(uploadResult.status).toBe('APPROVED');
      expect(uploadResult.currentStep).toBe('completed');
      expect(uploadResult.rewardCode).toBeDefined();
      expect(uploadResult.rewardCode).toContain('SPOTIFY');

      const session = engine.getSession(init.verificationId);
      expect(session?.status).toBe('APPROVED');
      expect(session?.rewardCode).toBe(uploadResult.rewardCode);
      expect(session?.uploadedDocumentId).toBe('doc_stan_id_2026');
    });

    it('should reject expired documents with EXPIRED_DOCUMENT code and remedy guidance', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_harvard_003',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@harvard.edu',
        merchantId: 'chatgpt_plus',
      });

      const mockBlob = new Blob(['EXPIRED_HARVARD_STUDENT_ID_DATA'], { type: 'image/png' });
      const uploadResult = engine.uploadDocumentDirect(init.verificationId, mockBlob, {
        id: 'doc_harv_id_2024',
        docType: 'STUDENT_ID',
        fileName: 'harvard_id_2024.png',
        expirationDate: '2024-05-31',
        isValid: false,
        isIllegible: false,
      });

      expect(uploadResult.status).toBe('REJECTED');
      expect(uploadResult.rejectionCode).toBe('EXPIRED_DOCUMENT');
      expect(uploadResult.rejectionReason).toContain('Your student ID is expired');
      expect(uploadResult.remedyText).toContain('Please submit a current term tuition receipt or transcript');
      expect(uploadResult.rewardCode).toBeUndefined();

      const session = engine.getSession(init.verificationId);
      expect(session?.status).toBe('REJECTED');
      expect(session?.rejectionCode).toBe('EXPIRED_DOCUMENT');
    });

    it('should reject blurry or low-resolution scans with ILLEGIBLE_DOCUMENT code and remedy guidance', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_berkeley_004',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@berkeley.edu',
        merchantId: 'notion_education',
      });

      const mockBlob = new Blob(['BLURRY_BERKELEY_PHOTO_DATA'], { type: 'image/jpeg' });
      const uploadResult = engine.uploadDocumentDirect(init.verificationId, mockBlob, {
        id: 'doc_berk_blurry_id',
        docType: 'STUDENT_ID',
        fileName: 'berkeley_blurry_id.jpg',
        expirationDate: '2027-05-31',
        isValid: false,
        isIllegible: true,
      });

      expect(uploadResult.status).toBe('REJECTED');
      expect(uploadResult.rejectionCode).toBe('ILLEGIBLE_DOCUMENT');
      expect(uploadResult.rejectionReason).toContain('Image resolution too low');
      expect(uploadResult.remedyText).toContain('Please submit an official PDF transcript');

      const session = engine.getSession(init.verificationId);
      expect(session?.status).toBe('REJECTED');
      expect(session?.rejectionCode).toBe('ILLEGIBLE_DOCUMENT');
    });

    it('should support retry submissions on the same verificationId session after rejection', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_harvard_003',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@harvard.edu',
        merchantId: 'spotify_premium',
      });

      // 1. Initial failed attempt (expired ID)
      const expiredBlob = new Blob(['EXPIRED_DOC_DATA'], { type: 'image/png' });
      const firstResult = engine.uploadDocumentDirect(init.verificationId, expiredBlob, {
        id: 'doc_harv_id_2024',
        docType: 'STUDENT_ID',
        expirationDate: '2024-05-31',
        isValid: false,
        isIllegible: false,
      });
      expect(firstResult.status).toBe('REJECTED');
      expect(firstResult.rejectionCode).toBe('EXPIRED_DOCUMENT');

      // 2. Retry upload on the same verificationId with valid tuition receipt
      const validTuitionBlob = new Blob(['VALID_TUITION_RECEIPT_PDF'], { type: 'application/pdf' });
      const retryResult = engine.uploadDocumentDirect(init.verificationId, validTuitionBlob, {
        id: 'doc_harv_tuition_2026',
        docType: 'TUITION_RECEIPT',
        expirationDate: '2026-12-31',
        isValid: true,
        isIllegible: false,
      });

      expect(retryResult.verificationId).toBe(init.verificationId);
      expect(retryResult.status).toBe('APPROVED');
      expect(retryResult.rewardCode).toBeDefined();
      expect(retryResult.rewardCode).toContain('SPOTIFY');

      const finalSession = engine.getSession(init.verificationId);
      expect(finalSession?.status).toBe('APPROVED');
      expect(finalSession?.uploadedDocumentId).toBe('doc_harv_tuition_2026');
      expect(finalSession?.rejectionCode).toBeUndefined();
    });

    it('should support simulation of direct PUT to pre-signed S3 upload URL', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_berkeley_004',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@berkeley.edu',
        merchantId: 'aws_educate',
      });

      expect(init.uploadUrl).toBeDefined();

      const transcriptBlob = new Blob(['OFFICIAL_TRANSCRIPT_PDF'], { type: 'application/pdf' });
      const result = engine.simulateDirectPut(init.uploadUrl!, transcriptBlob, {
        id: 'doc_berk_transcript_2026',
        docType: 'TRANSCRIPT',
        expirationDate: '2027-05-31',
        isValid: true,
        isIllegible: false,
      });

      expect(result.status).toBe('APPROVED');
      expect(result.rewardCode).toBeDefined();
      expect(result.rewardCode).toContain('AWS');
    });

    it('should support completeDocUpload review handshake', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_stanford_002',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'schen@stanford.edu',
        merchantId: 'chatgpt_plus',
      });

      const scheduleBlob = new Blob(['SCHEDULE_PDF'], { type: 'application/pdf' });
      engine.uploadDocumentDirect(init.verificationId, scheduleBlob, {
        id: 'doc_stan_schedule_2026',
        docType: 'CLASS_SCHEDULE',
        isValid: true,
      });

      const completeResult = engine.completeDocUpload(init.verificationId);
      expect(completeResult.status).toBe('APPROVED');
      expect(completeResult.rewardCode).toBeDefined();
    });

    it('should throw when uploading document to unknown verification session ID', () => {
      const mockBlob = new Blob(['DATA'], { type: 'image/png' });
      expect(() =>
        engine.uploadDocumentDirect('ver_non_existent', mockBlob, {
          id: 'doc_test',
          isValid: true,
        }),
      ).toThrow(/session not found/i);
    });

    it('should throw when uploading an empty or invalid Blob', () => {
      const init = engine.submitPersonalInfo({
        schoolId: 'sch_stanford_002',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'schen@stanford.edu',
      });

      expect(() =>
        engine.uploadDocumentDirect(init.verificationId, null as any),
      ).toThrow(/Blob is required/i);
    });
  });

  describe('Input Validation', () => {
    it('should throw an error if schoolId is missing', () => {
      expect(() =>
        engine.submitPersonalInfo({
          schoolId: '',
          firstName: 'John',
          lastName: 'Doe',
          email: 'jdoe@mit.edu',
        }),
      ).toThrow(/schoolId is required/i);
    });

    it('should throw an error if student name is missing', () => {
      expect(() =>
        engine.submitPersonalInfo({
          schoolId: 'sch_mit_001',
          firstName: '',
          lastName: 'Doe',
          email: 'jdoe@mit.edu',
        }),
      ).toThrow(/firstName and lastName are required/i);
    });

    it('should throw an error if email is invalid', () => {
      expect(() =>
        engine.submitPersonalInfo({
          schoolId: 'sch_mit_001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
        }),
      ).toThrow(/valid email address/i);
    });

    it('should throw an error for unaccredited or non-existent schoolId', () => {
      expect(() =>
        engine.submitPersonalInfo({
          schoolId: 'sch_fake_999',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@fake.edu',
        }),
      ).toThrow(/institution not found/i);
    });
  });

  describe('Session Management', () => {
    it('should retrieve all active sessions', () => {
      engine.submitPersonalInfo({
        schoolId: 'sch_mit_001',
        firstName: 'User1',
        lastName: 'Test',
        email: 'u1@mit.edu',
      });
      engine.submitPersonalInfo({
        schoolId: 'sch_stanford_002',
        firstName: 'User2',
        lastName: 'Test',
        email: 'u2@stanford.edu',
      });

      const sessions = engine.getAllSessions();
      expect(sessions.length).toBe(2);
    });

    it('should reset all sessions when cleared', () => {
      engine.submitPersonalInfo({
        schoolId: 'sch_mit_001',
        firstName: 'User1',
        lastName: 'Test',
        email: 'u1@mit.edu',
      });
      engine.reset();
      expect(engine.getAllSessions().length).toBe(0);
    });
  });
});
