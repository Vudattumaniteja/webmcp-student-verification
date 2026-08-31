import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureStore } from './state.ts';
import { createArchitectureTools } from './tools.ts';

describe('Architecture Studio Tools and State', () => {
  let store: ArchitectureStore;
  let tools: ReturnType<typeof createArchitectureTools>;

  beforeEach(() => {
    store = new ArchitectureStore({ nodes: [], connections: [], logs: [] });
    tools = createArchitectureTools();
  });

  it('adds a new node via add_architecture_node tool', async () => {
    const addTool = tools.find((t) => t.name === 'add_architecture_node')!;
    const result = await addTool.execute(
      {
        type: 'database',
        name: 'Analytics Warehouse',
        tier: 'premium',
        replicas: 2,
      },
      store,
      'WebMCP',
    );

    expect(result).toContain('Analytics Warehouse');
    expect(store.getState().nodes.length).toBe(1);
    expect(store.getState().nodes[0].monthlyCost).toBe(500); // 250 * 2
  });

  it('connects two nodes via connect_architecture_nodes tool', async () => {
    const node1 = store.addNode({ type: 'api_gateway', name: 'Gateway' });
    const node2 = store.addNode({ type: 'serverless_function', name: 'Worker' });

    const connectTool = tools.find((t) => t.name === 'connect_architecture_nodes')!;
    const result = await connectTool.execute(
      {
        sourceNodeId: node1.id,
        targetNodeId: node2.id,
        protocol: 'https',
      },
      store,
      'WebMCP',
    );

    expect(result).toContain('Connected');
    expect(store.getState().connections.length).toBe(1);
  });

  it('executes security audit identifying direct database exposure', async () => {
    const gw = store.addNode({ type: 'api_gateway', name: 'Public Gateway' });
    const db = store.addNode({ type: 'database', name: 'Unprotected DB', replicas: 1 });
    store.connectNodes({ source: gw.id, target: db.id });

    const auditTool = tools.find((t) => t.name === 'run_architecture_security_audit')!;
    const output = await auditTool.execute({}, store, 'WebMCP');
    const parsed = JSON.parse(output);

    expect(parsed.issuesCount).toBeGreaterThanOrEqual(1);
    expect(parsed.issues.some((i: any) => i.title.includes('Direct Database Exposure'))).toBe(true);
    expect(parsed.securityScore).toBeLessThan(100);
  });

  it('calculates monthly cost breakdown accurately', async () => {
    store.addNode({ type: 'api_gateway', name: 'Gateway', tier: 'standard', replicas: 1 }); // 35
    store.addNode({ type: 'cache', name: 'Redis', tier: 'standard', replicas: 1 }); // 45

    const costTool = tools.find((t) => t.name === 'estimate_architecture_cost')!;
    const output = await costTool.execute({}, store, 'WebMCP');
    const parsed = JSON.parse(output);

    expect(parsed.totalMonthlyCostUSD).toBe(80);
    expect(parsed.breakdown.length).toBe(2);
  });

  it('exports valid terraform configuration', async () => {
    store.addNode({ type: 'database', name: 'MainDB', tier: 'standard', replicas: 2 });
    const tfTool = tools.find((t) => t.name === 'export_architecture_terraform')!;
    const tf = await tfTool.execute({}, store, 'WebMCP');

    expect(tf).toContain('resource "aws_database"');
    expect(tf).toContain('replicas = 2');
  });

  it('updates existing node properties', async () => {
    const node = store.addNode({ type: 'serverless_function', name: 'Fn', replicas: 1, tier: 'basic' });
    const updateTool = tools.find((t) => t.name === 'update_architecture_node')!;
    await updateTool.execute(
      {
        nodeId: node.id,
        replicas: 4,
        tier: 'premium',
      },
      store,
      'WebMCP',
    );

    const updated = store.getState().nodes.find((n) => n.id === node.id)!;
    expect(updated.replicas).toBe(4);
    expect(updated.tier).toBe('premium');
    expect(updated.monthlyCost).toBe(240); // 60 * 4
  });
});
