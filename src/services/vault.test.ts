import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentVault } from './vault.ts';
import { createVaultTools } from './vaultTools.ts';
import { DEMO_PRESETS } from './vaultPresets.ts';

describe('Student Document Vault & Demo Presets (Ticket #3)', () => {
  let vault: StudentVault;

  beforeEach(() => {
    vault = new StudentVault('STANFORD_VALID');
  });

  describe('Initialization & Presets', () => {
    it('initializes with default STANFORD_VALID preset', () => {
      const state = vault.getState();
      expect(state.activePresetId).toBe('STANFORD_VALID');
      expect(state.profile.firstName).toBe('Alex');
      expect(state.profile.lastName).toBe('Chen');
      expect(state.profile.universityName).toBe('Stanford University');
      expect(state.profile.email).toBe('alex.chen@stanford.edu');
      expect(state.documents.length).toBe(2);
    });

    it('contains all 4 distinct demo student presets', () => {
      const presets = vault.getAllPresets();
      expect(presets.length).toBe(4);

      const presetIds = presets.map((p) => p.id);
      expect(presetIds).toContain('STANFORD_VALID');
      expect(presetIds).toContain('HARVARD_EXPIRED');
      expect(presetIds).toContain('BERKELEY_ILLEGIBLE');
      expect(presetIds).toContain('MIT_INSTANT');
    });

    it('configures STANFORD_VALID with valid ID and class schedule', () => {
      const stanford = DEMO_PRESETS.STANFORD_VALID;
      expect(stanford.profile.universityId).toBe('school_stanford_01');
      expect(stanford.documents.length).toBe(2);

      const idDoc = stanford.documents.find((d) => d.docType === 'STUDENT_ID')!;
      expect(idDoc.isValid).toBe(true);
      expect(idDoc.id).toBe('doc_stan_id_2026');

      const scheduleDoc = stanford.documents.find((d) => d.docType === 'CLASS_SCHEDULE')!;
      expect(scheduleDoc.isValid).toBe(true);
      expect(scheduleDoc.id).toBe('doc_stan_schedule_2026');
    });

    it('configures HARVARD_EXPIRED with expired ID and valid tuition bill', () => {
      const harvard = DEMO_PRESETS.HARVARD_EXPIRED;
      expect(harvard.profile.firstName).toBe('Maya');
      expect(harvard.profile.universityName).toBe('Harvard University');

      const expiredId = harvard.documents.find((d) => d.docType === 'STUDENT_ID')!;
      expect(expiredId.isValid).toBe(false);
      expect(expiredId.expirationDate).toBe('2024-05-31');

      const validTuition = harvard.documents.find((d) => d.docType === 'TUITION_RECEIPT')!;
      expect(validTuition.isValid).toBe(true);
    });

    it('configures BERKELEY_ILLEGIBLE with blurry scan and valid transcript', () => {
      const berkeley = DEMO_PRESETS.BERKELEY_ILLEGIBLE;
      expect(berkeley.profile.firstName).toBe('Jordan');
      expect(berkeley.profile.universityName).toBe('University of California, Berkeley');

      const blurryDoc = berkeley.documents.find((d) => d.docType === 'STUDENT_ID')!;
      expect(blurryDoc.isIllegible).toBe(true);
      expect(blurryDoc.isValid).toBe(false);

      const transcriptDoc = berkeley.documents.find((d) => d.docType === 'TRANSCRIPT')!;
      expect(transcriptDoc.isValid).toBe(true);
    });

    it('configures MIT_INSTANT with instant registrar eligible graduate student', () => {
      const mit = DEMO_PRESETS.MIT_INSTANT;
      expect(mit.profile.firstName).toBe('Marcus');
      expect(mit.profile.universityName).toBe('Massachusetts Institute of Technology');
      expect(mit.profile.academicLevel).toBe('GRADUATE');
      expect(mit.profile.email).toBe('marcus.vance@mit.edu');
    });
  });

  describe('Preset Switching & State Reactivity', () => {
    it('switches active preset to HARVARD_EXPIRED and updates documents', () => {
      vault.switchPreset('HARVARD_EXPIRED');
      const state = vault.getState();

      expect(state.activePresetId).toBe('HARVARD_EXPIRED');
      expect(state.profile.firstName).toBe('Maya');
      expect(state.profile.universityName).toBe('Harvard University');
      expect(state.documents.some((d) => d.id === 'doc_harv_id_2024')).toBe(true);
      expect(state.documents.some((d) => d.id === 'doc_harv_tuition_2026')).toBe(true);
    });

    it('switches active preset to BERKELEY_ILLEGIBLE and MIT_INSTANT', () => {
      vault.switchPreset('BERKELEY_ILLEGIBLE');
      expect(vault.getState().profile.firstName).toBe('Jordan');

      vault.switchPreset('MIT_INSTANT');
      expect(vault.getState().profile.firstName).toBe('Marcus');
    });

    it('notifies subscribers upon preset switch', () => {
      const listener = vi.fn();
      const unsubscribe = vault.subscribe(listener);

      vault.switchPreset('BERKELEY_ILLEGIBLE');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          activePresetId: 'BERKELEY_ILLEGIBLE',
        }),
      );

      unsubscribe();
      vault.switchPreset('MIT_INSTANT');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Claim-Check Discovery & Zero-PII Privacy', () => {
    it('returns sanitized document metadata handles without leaking binary data', () => {
      const handles = vault.listSanitizedHandles();
      expect(handles.length).toBe(2);

      handles.forEach((handle) => {
        expect(handle).toHaveProperty('documentId');
        expect(handle).toHaveProperty('docType');
        expect(handle).toHaveProperty('fileName');
        expect(handle).toHaveProperty('isValid');
        expect(handle).not.toHaveProperty('binaryBlob');
        expect(handle).not.toHaveProperty('blob');
        expect(handle).not.toHaveProperty('data');
        expect(handle).not.toHaveProperty('base64');
      });
    });

    it('keeps list_vault_documents JSON payload strictly under 300 characters for all presets', () => {
      const presetIds: Array<'STANFORD_VALID' | 'HARVARD_EXPIRED' | 'BERKELEY_ILLEGIBLE' | 'MIT_INSTANT'> = [
        'STANFORD_VALID',
        'HARVARD_EXPIRED',
        'BERKELEY_ILLEGIBLE',
        'MIT_INSTANT',
      ];

      for (const presetId of presetIds) {
        vault.switchPreset(presetId);
        const handles = vault.listSanitizedHandles();
        const jsonStr = JSON.stringify(handles);

        expect(jsonStr.length).toBeLessThan(300);
      }
    });

    it('returns clean student profile metadata', () => {
      const profile = vault.getSanitizedProfile();
      expect(profile.firstName).toBe('Alex');
      expect(profile.lastName).toBe('Chen');
      expect(profile.email).toBe('alex.chen@stanford.edu');
      expect(profile.universityName).toBe('Stanford University');
    });
  });

  describe('Binary Blob Storage & Handle Resolution', () => {
    it('resolves binary Blob by document handle', async () => {
      const blob = await vault.getDocumentBlob('doc_stan_id_2026');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob!.size).toBeGreaterThan(0);
      expect(blob!.type).toBe('image/png');
    });

    it('returns null for non-existent document handle', async () => {
      const blob = await vault.getDocumentBlob('non_existent_doc_id');
      expect(blob).toBeNull();
    });

    it('allows storing and retrieving custom uploaded documents', async () => {
      const customBlob = new Blob(['sample-transcript-content'], { type: 'application/pdf' });
      const addedDoc = await vault.addCustomDocument(
        {
          title: 'Custom Official Transcript',
          fileName: 'custom_transcript.pdf',
          docType: 'TRANSCRIPT',
          mimeType: 'application/pdf',
          fileSizeBytes: customBlob.size,
          issueDate: '2026-08-01',
          isValid: true,
        },
        customBlob,
      );

      expect(addedDoc.id).toMatch(/^doc_custom_/);
      expect(vault.getState().documents.some((d) => d.id === addedDoc.id)).toBe(true);

      const retrievedBlob = await vault.getDocumentBlob(addedDoc.id);
      expect(retrievedBlob).not.toBeNull();
      expect(retrievedBlob!.type).toBe('application/pdf');
    });

    it('removes a document by handle ID', () => {
      const initialCount = vault.getState().documents.length;
      const success = vault.removeDocument('doc_stan_id_2026');
      expect(success).toBe(true);
      expect(vault.getState().documents.length).toBe(initialCount - 1);
      expect(vault.getDocumentMetadata('doc_stan_id_2026')).toBeUndefined();
    });
  });

  describe('WebMCP Tools Compliance', () => {
    let tools: ReturnType<typeof createVaultTools>;

    beforeEach(() => {
      tools = createVaultTools(vault);
    });

    it('creates all 3 required WebMCP vault tools', () => {
      expect(tools.length).toBe(3);
      const names = tools.map((t) => t.name);
      expect(names).toContain('get_student_vault_profile');
      expect(names).toContain('list_vault_documents');
      expect(names).toContain('switch_demo_preset');
    });

    it('ensures all tool descriptions are strictly under 180 characters', () => {
      tools.forEach((tool) => {
        expect(tool.description.length).toBeLessThan(180);
      });
    });

    it('get_student_vault_profile executes and returns student identity JSON', async () => {
      const tool = tools.find((t) => t.name === 'get_student_vault_profile')!;
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.untrustedContentHint).toBe(false);

      const result = await tool.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.firstName).toBe('Alex');
      expect(parsed.universityName).toBe('Stanford University');
      expect(parsed.email).toBe('alex.chen@stanford.edu');
    });

    it('list_vault_documents executes and returns sanitized handles < 300 chars', async () => {
      const tool = tools.find((t) => t.name === 'list_vault_documents')!;
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.untrustedContentHint).toBe(false);

      const result = await tool.execute({});
      expect(result.length).toBeLessThan(300);

      const handles = JSON.parse(result);
      expect(Array.isArray(handles)).toBe(true);
      expect(handles[0]).toHaveProperty('documentId');
      expect(handles[0]).toHaveProperty('docType');
    });

    it('switch_demo_preset executes and updates active persona and documents', async () => {
      const tool = tools.find((t) => t.name === 'switch_demo_preset')!;
      expect(tool.annotations.readOnlyHint).toBe(false);
      expect(tool.annotations.untrustedContentHint).toBe(false);

      const response = await tool.execute({ presetId: 'HARVARD_EXPIRED' });
      expect(response).toContain('HARVARD_EXPIRED');
      expect(vault.getState().profile.firstName).toBe('Maya');
      expect(vault.getState().profile.universityName).toBe('Harvard University');
    });

    it('switch_demo_preset handles invalid preset gracefully', async () => {
      const tool = tools.find((t) => t.name === 'switch_demo_preset')!;
      await expect(tool.execute({ presetId: 'UNKNOWN_PRESET' as any })).rejects.toThrow(
        /Invalid preset ID/i,
      );
    });
  });
});
