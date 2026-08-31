import { describe, it, expect, beforeEach } from 'vitest';
import { createVerificationTools } from './verificationTools';
import { VerificationEngine } from '../services/verificationEngine';
import { StudentVault } from '../services/vault';

describe('WebMCP Verification Tools', () => {
  let engine: VerificationEngine;
  let vault: StudentVault;
  let tools: ReturnType<typeof createVerificationTools>;

  beforeEach(() => {
    engine = new VerificationEngine();
    vault = new StudentVault('STANFORD_VALID');
    tools = createVerificationTools(engine, vault);
  });

  describe('search_school tool', () => {
    it('should have required WebMCP specification properties and annotations', () => {
      const searchTool = tools.find((t) => t.name === 'search_school');
      expect(searchTool).toBeDefined();
      expect(searchTool?.annotations.readOnlyHint).toBe(true);
      expect(searchTool?.annotations.untrustedContentHint).toBe(false);
      expect(searchTool?.description.length).toBeLessThan(180);
      expect(searchTool?.inputSchema.properties.query).toBeDefined();
    });

    it('should return matching universities in a JSON response under 450 characters', async () => {
      const searchTool = tools.find((t) => t.name === 'search_school')!;
      const response = await searchTool.execute({ query: 'MIT' });

      expect(typeof response).toBe('string');
      expect(response.length).toBeLessThan(450);

      const parsed = JSON.parse(response);
      expect(parsed.schools).toBeDefined();
      expect(parsed.schools.length).toBeGreaterThan(0);
      expect(parsed.schools[0].id).toBe('sch_mit_001');
      expect(parsed.schools[0].instantEligible).toBe(true);
    });

    it('should search for Stanford and Berkeley accurately', async () => {
      const searchTool = tools.find((t) => t.name === 'search_school')!;

      const stanfordRes = await searchTool.execute({ query: 'Stanford' });
      expect(stanfordRes.length).toBeLessThan(450);
      expect(stanfordRes).toContain('sch_stanford_002');

      const berkeleyRes = await searchTool.execute({ query: 'Berkeley' });
      expect(berkeleyRes.length).toBeLessThan(450);
      expect(berkeleyRes).toContain('sch_berkeley_004');
    });

    it('should handle empty or no-match queries gracefully', async () => {
      const searchTool = tools.find((t) => t.name === 'search_school')!;
      const noMatchRes = await searchTool.execute({ query: 'xyz_unknown_school' });
      expect(noMatchRes.length).toBeLessThan(450);
      const parsed = JSON.parse(noMatchRes);
      expect(parsed.schools).toEqual([]);
    });
  });

  describe('submit_student_verification tool', () => {
    it('should have required WebMCP specification properties and annotations', () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification');
      expect(submitTool).toBeDefined();
      expect(submitTool?.annotations.readOnlyHint).toBe(false);
      expect(submitTool?.annotations.untrustedContentHint).toBe(false);
      expect(submitTool?.description.length).toBeLessThan(180);
      expect(submitTool?.inputSchema.required).toContain('schoolId');
      expect(submitTool?.inputSchema.required).toContain('firstName');
      expect(submitTool?.inputSchema.required).toContain('lastName');
      expect(submitTool?.inputSchema.required).toContain('email');
    });

    it('should execute instant registrar approval for MIT student under 450 characters', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const response = await submitTool.execute({
        schoolId: 'sch_mit_001',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex.rivera@mit.edu',
        merchantId: 'chatgpt_plus',
      });

      expect(typeof response).toBe('string');
      expect(response.length).toBeLessThan(450);

      const parsed = JSON.parse(response);
      expect(parsed.verificationId).toBeDefined();
      expect(parsed.status).toBe('APPROVED');
      expect(parsed.rewardCode).toBeDefined();
      expect(parsed.rewardCode).toContain('CHATGPT');
    });

    it('should execute document upload fallback for Stanford student under 450 characters', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const response = await submitTool.execute({
        schoolId: 'sch_stanford_002',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'schen@stanford.edu',
        merchantId: 'spotify_premium',
      });

      expect(typeof response).toBe('string');
      expect(response.length).toBeLessThan(450);

      const parsed = JSON.parse(response);
      expect(parsed.verificationId).toBeDefined();
      expect(parsed.status).toBe('PENDING_DOCS');
      expect(parsed.currentStep).toBe('docUpload');
      expect(parsed.uploadUrl).toBeDefined();
      expect(parsed.uploadUrl).toContain('https://s3.sheerid-mock.internal/uploads/');
      expect(parsed.allowedDocTypes).toBeDefined();
    });

    it('should return structured error response if validation fails', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const response = await submitTool.execute({
        schoolId: '',
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid',
      });

      expect(typeof response).toBe('string');
      expect(response.length).toBeLessThan(450);

      const parsed = JSON.parse(response);
      expect(parsed.error).toBeDefined();
    });
  });

  describe('upload_vault_document tool', () => {
    it('should have required WebMCP specification properties and annotations', () => {
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document');
      expect(uploadTool).toBeDefined();
      expect(uploadTool?.annotations.readOnlyHint).toBe(false);
      expect(uploadTool?.annotations.untrustedContentHint).toBe(false);
      expect(uploadTool?.description.length).toBeLessThan(180);
      expect(uploadTool?.inputSchema.required).toContain('verificationId');
      expect(uploadTool?.inputSchema.required).toContain('documentId');
    });

    it('should upload valid Stanford document handle and return approval under 450 characters', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_stanford_002',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@stanford.edu',
        merchantId: 'spotify_premium',
      });
      const { verificationId } = JSON.parse(initRes);

      const uploadRes = await uploadTool.execute({
        verificationId,
        documentId: 'doc_stan_id_2026',
      });

      expect(typeof uploadRes).toBe('string');
      expect(uploadRes.length).toBeLessThan(450);
      // Ensure no raw binary data or base64 is in the response payload
      expect(uploadRes).not.toContain('MOCK_BINARY_DATA');
      expect(uploadRes).not.toContain('base64');

      const parsed = JSON.parse(uploadRes);
      expect(parsed.verificationId).toBe(verificationId);
      expect(parsed.status).toBe('APPROVED');
      expect(parsed.rewardCode).toBeDefined();
      expect(parsed.rewardCode).toContain('SPOTIFY');
    });

    it('should upload Harvard expired document and return structured EXPIRED_DOCUMENT rejection', async () => {
      vault.switchPreset('HARVARD_EXPIRED');
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_harvard_003',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@harvard.edu',
        merchantId: 'chatgpt_plus',
      });
      const { verificationId } = JSON.parse(initRes);

      const uploadRes = await uploadTool.execute({
        verificationId,
        documentId: 'doc_harv_id_2024',
      });

      expect(uploadRes.length).toBeLessThan(450);
      const parsed = JSON.parse(uploadRes);
      expect(parsed.status).toBe('REJECTED');
      expect(parsed.rejectionCode).toBe('EXPIRED_DOCUMENT');
      expect(parsed.rejectionReason).toContain('expired');
      expect(parsed.remedyText).toBeDefined();
    });

    it('should upload Berkeley blurry document and return structured ILLEGIBLE_DOCUMENT rejection', async () => {
      vault.switchPreset('BERKELEY_ILLEGIBLE');
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_berkeley_004',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'jordan.lee@berkeley.edu',
        merchantId: 'notion_education',
      });
      const { verificationId } = JSON.parse(initRes);

      const uploadRes = await uploadTool.execute({
        verificationId,
        documentId: 'doc_berk_blurry_id',
      });

      expect(uploadRes.length).toBeLessThan(450);
      const parsed = JSON.parse(uploadRes);
      expect(parsed.status).toBe('REJECTED');
      expect(parsed.rejectionCode).toBe('ILLEGIBLE_DOCUMENT');
      expect(parsed.rejectionReason).toContain('Image resolution too low');
    });

    it('should support retry upload on the same verificationId with alternative document', async () => {
      vault.switchPreset('HARVARD_EXPIRED');
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_harvard_003',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@harvard.edu',
        merchantId: 'spotify_premium',
      });
      const { verificationId } = JSON.parse(initRes);

      // 1. Initial attempt fails
      const failRes = await uploadTool.execute({
        verificationId,
        documentId: 'doc_harv_id_2024',
      });
      expect(JSON.parse(failRes).status).toBe('REJECTED');

      // 2. Retry attempt succeeds on same verificationId
      const retryRes = await uploadTool.execute({
        verificationId,
        documentId: 'doc_harv_tuition_2026',
      });
      expect(retryRes.length).toBeLessThan(450);
      const retryParsed = JSON.parse(retryRes);
      expect(retryParsed.status).toBe('APPROVED');
      expect(retryParsed.rewardCode).toBeDefined();
    });

    it('should return error when document ID does not exist in vault', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_stanford_002',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@stanford.edu',
      });
      const { verificationId } = JSON.parse(initRes);

      const res = await uploadTool.execute({
        verificationId,
        documentId: 'doc_non_existent',
      });

      const parsed = JSON.parse(res);
      expect(parsed.error).toContain('not found in vault');
    });
  });

  describe('check_verification_status tool', () => {
    it('should have required WebMCP specification properties and annotations', () => {
      const statusTool = tools.find((t) => t.name === 'check_verification_status');
      expect(statusTool).toBeDefined();
      expect(statusTool?.annotations.readOnlyHint).toBe(true);
      expect(statusTool?.annotations.untrustedContentHint).toBe(false);
      expect(statusTool?.description.length).toBeLessThan(180);
      expect(statusTool?.inputSchema.required).toContain('verificationId');
    });

    it('should report PENDING_DOCS status before document upload under 450 characters', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const statusTool = tools.find((t) => t.name === 'check_verification_status')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_stanford_002',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@stanford.edu',
      });
      const { verificationId } = JSON.parse(initRes);

      const statusRes = await statusTool.execute({ verificationId });
      expect(statusRes.length).toBeLessThan(450);

      const parsed = JSON.parse(statusRes);
      expect(parsed.verificationId).toBe(verificationId);
      expect(parsed.status).toBe('PENDING_DOCS');
      expect(parsed.currentStep).toBe('docUpload');
      expect(parsed.uploadUrl).toBeDefined();
    });

    it('should report APPROVED status and reward code after successful instant or document verification', async () => {
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const statusTool = tools.find((t) => t.name === 'check_verification_status')!;

      const instantRes = await submitTool.execute({
        schoolId: 'sch_mit_001',
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'marcus.vance@mit.edu',
        merchantId: 'chatgpt_plus',
      });
      const { verificationId, rewardCode } = JSON.parse(instantRes);

      const statusRes = await statusTool.execute({ verificationId });
      expect(statusRes.length).toBeLessThan(450);

      const parsed = JSON.parse(statusRes);
      expect(parsed.status).toBe('APPROVED');
      expect(parsed.rewardCode).toBe(rewardCode);
    });

    it('should report REJECTED status with rejectionCode and remedy guidance', async () => {
      vault.switchPreset('HARVARD_EXPIRED');
      const submitTool = tools.find((t) => t.name === 'submit_student_verification')!;
      const uploadTool = tools.find((t) => t.name === 'upload_vault_document')!;
      const statusTool = tools.find((t) => t.name === 'check_verification_status')!;

      const initRes = await submitTool.execute({
        schoolId: 'sch_harvard_003',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya.patel@harvard.edu',
      });
      const { verificationId } = JSON.parse(initRes);

      await uploadTool.execute({ verificationId, documentId: 'doc_harv_id_2024' });

      const statusRes = await statusTool.execute({ verificationId });
      expect(statusRes.length).toBeLessThan(450);

      const parsed = JSON.parse(statusRes);
      expect(parsed.status).toBe('REJECTED');
      expect(parsed.rejectionCode).toBe('EXPIRED_DOCUMENT');
      expect(parsed.rejectionReason).toBeDefined();
      expect(parsed.remedyText).toBeDefined();
    });

    it('should return error for non-existent verificationId', async () => {
      const statusTool = tools.find((t) => t.name === 'check_verification_status')!;
      const res = await statusTool.execute({ verificationId: 'ver_fake_999' });

      const parsed = JSON.parse(res);
      expect(parsed.error).toContain('not found');
    });
  });
});
