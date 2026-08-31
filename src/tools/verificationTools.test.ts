import { describe, it, expect, beforeEach } from 'vitest';
import { createVerificationTools } from './verificationTools';
import { VerificationEngine } from '../services/verificationEngine';

describe('WebMCP Verification Tools', () => {
  let engine: VerificationEngine;
  let tools: ReturnType<typeof createVerificationTools>;

  beforeEach(() => {
    engine = new VerificationEngine();
    tools = createVerificationTools(engine);
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
});
