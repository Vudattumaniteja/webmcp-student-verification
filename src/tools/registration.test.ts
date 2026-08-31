import { describe, it, expect, beforeEach } from 'vitest';
import { createVerificationTools } from './verificationTools';
import { globalVerificationEngine } from '../services/verificationEngine';
import { createVaultTools } from '../services/vaultTools';
import { StudentVault } from '../services/vault';

describe('WebMCP document.modelContext Registration', () => {
  beforeEach(() => {
    globalVerificationEngine.reset();
  });

  it('should register verification and vault tools onto document.modelContext', async () => {
    const modelContext = (document as any).modelContext;
    expect(modelContext).toBeDefined();

    const vault = new StudentVault();
    const tools = [
      ...createVerificationTools(globalVerificationEngine, vault),
      ...createVaultTools(vault),
    ];
    for (const tool of tools) {
      await modelContext.registerTool({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (input: any) => tool.execute(input),
        annotations: tool.annotations,
      });
    }

    const registered = await modelContext.getTools();
    const names = registered.map((t: any) => t.name);

    expect(names).toContain('search_school');
    expect(names).toContain('submit_student_verification');
    expect(names).toContain('upload_vault_document');
    expect(names).toContain('check_verification_status');
    expect(names).toContain('get_student_vault_profile');
    expect(names).toContain('list_vault_documents');
    expect(names).toContain('switch_demo_preset');
  });

  it('should execute registered tools via document.modelContext.executeTool for instant and document upload paths', async () => {
    const modelContext = (document as any).modelContext;
    const vault = new StudentVault('STANFORD_VALID');
    const tools = [
      ...createVerificationTools(globalVerificationEngine, vault),
      ...createVaultTools(vault),
    ];
    for (const tool of tools) {
      await modelContext.registerTool({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (input: any) => tool.execute(input),
        annotations: tool.annotations,
      });
    }

    // 1. Search school
    const searchResultStr = await modelContext.executeTool(
      { name: 'search_school' },
      JSON.stringify({ query: 'Harvard' }),
    );
    const parsedSearch = JSON.parse(searchResultStr);
    expect(parsedSearch.schools[0].id).toBe('sch_harvard_003');

    // 2. Submit instant match (MIT)
    const submitInstantStr = await modelContext.executeTool(
      { name: 'submit_student_verification' },
      JSON.stringify({
        schoolId: 'sch_mit_001',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena@mit.edu',
        merchantId: 'notion_education',
      }),
    );
    const parsedInstant = JSON.parse(submitInstantStr);
    expect(parsedInstant.status).toBe('APPROVED');
    expect(parsedInstant.rewardCode).toBeDefined();

    // 3. Submit fallback match requiring doc upload (Stanford)
    const submitFallbackStr = await modelContext.executeTool(
      { name: 'submit_student_verification' },
      JSON.stringify({
        schoolId: 'sch_stanford_002',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@stanford.edu',
        merchantId: 'spotify_premium',
      }),
    );
    const parsedFallback = JSON.parse(submitFallbackStr);
    expect(parsedFallback.status).toBe('PENDING_DOCS');
    const verificationId = parsedFallback.verificationId;

    // 4. Check status before upload
    const statusBeforeStr = await modelContext.executeTool(
      { name: 'check_verification_status' },
      JSON.stringify({ verificationId }),
    );
    const parsedStatusBefore = JSON.parse(statusBeforeStr);
    expect(parsedStatusBefore.status).toBe('PENDING_DOCS');

    // 5. Upload document via handle
    const uploadStr = await modelContext.executeTool(
      { name: 'upload_vault_document' },
      JSON.stringify({
        verificationId,
        documentId: 'doc_stan_id_2026',
      }),
    );
    const parsedUpload = JSON.parse(uploadStr);
    expect(parsedUpload.status).toBe('APPROVED');
    expect(parsedUpload.rewardCode).toBeDefined();

    // 6. Check status after upload
    const statusAfterStr = await modelContext.executeTool(
      { name: 'check_verification_status' },
      JSON.stringify({ verificationId }),
    );
    const parsedStatusAfter = JSON.parse(statusAfterStr);
    expect(parsedStatusAfter.status).toBe('APPROVED');
    expect(parsedStatusAfter.rewardCode).toBe(parsedUpload.rewardCode);
  });
});
