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
    it('should require docUpload for Stanford students without instant match', () => {
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
      expect(result.uploadUrl).toContain(result.verificationId);
      expect(result.allowedDocTypes).toContain('STUDENT_ID');
      expect(result.allowedDocTypes).toContain('TUITION_RECEIPT');

      const session = engine.getSession(result.verificationId);
      expect(session).toBeDefined();
      expect(session?.status).toBe('PENDING_DOCS');
      expect(session?.currentStep).toBe('docUpload');
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
