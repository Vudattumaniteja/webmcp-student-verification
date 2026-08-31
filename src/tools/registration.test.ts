import { describe, it, expect, beforeEach } from 'vitest';
import { createVerificationTools } from './verificationTools';
import { globalVerificationEngine } from '../services/verificationEngine';

describe('WebMCP document.modelContext Registration', () => {
  beforeEach(() => {
    globalVerificationEngine.reset();
  });

  it('should register verification tools onto document.modelContext', async () => {
    const modelContext = (document as any).modelContext;
    expect(modelContext).toBeDefined();

    const tools = createVerificationTools(globalVerificationEngine);
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
  });

  it('should execute registered tools via document.modelContext.executeTool', async () => {
    const modelContext = (document as any).modelContext;
    const tools = createVerificationTools(globalVerificationEngine);
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

    const searchResultStr = await modelContext.executeTool(
      { name: 'search_school' },
      JSON.stringify({ query: 'Harvard' }),
    );

    const parsedSearch = JSON.parse(searchResultStr);
    expect(parsedSearch.schools[0].id).toBe('sch_harvard_003');

    const submitResultStr = await modelContext.executeTool(
      { name: 'submit_student_verification' },
      JSON.stringify({
        schoolId: 'sch_mit_001',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'elena@mit.edu',
        merchantId: 'notion_education',
      }),
    );

    const parsedSubmit = JSON.parse(submitResultStr);
    expect(parsedSubmit.status).toBe('APPROVED');
    expect(parsedSubmit.rewardCode).toBeDefined();
  });
});
