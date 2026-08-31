import '@testing-library/jest-dom';

// Polyfill / Mock document.modelContext for jsdom test runner
if (typeof document !== 'undefined' && !('modelContext' in document)) {
  const tools = new Map<string, any>();

  Object.defineProperty(document, 'modelContext', {
    value: {
      registerTool: async (tool: any) => {
        tools.set(tool.name, tool);
      },
      getTools: async () => {
        return Array.from(tools.values()).map((t) => ({
          name: t.name,
          title: t.title || '',
          description: t.description,
          inputSchema: JSON.stringify(t.inputSchema),
          origin: window.location.origin,
          window: window,
          annotations: t.annotations || { readOnlyHint: false, untrustedContentHint: false },
        }));
      },
      executeTool: async (tool: any, inputJson: string) => {
        const target = tools.get(tool.name);
        if (!target) throw new Error(`Tool ${tool.name} not found`);
        const args = JSON.parse(inputJson);
        const controller = new AbortController();
        return await target.execute(args, { signal: controller.signal });
      },
    },
    writable: true,
    configurable: true,
  });
}
