import { ArchitectureStore, NodeType } from './state.ts';

export type CallerSource = 'WebMCP' | 'MCP-Bridge' | 'UI';

export interface AppToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: any, store: ArchitectureStore, callerSource?: CallerSource) => Promise<string>;
}

export function createArchitectureTools(): AppToolDefinition[] {
  return [
    {
      name: 'add_architecture_node',
      title: 'Add Architecture Node',
      description: 'Creates a new infrastructure component on the visual architecture canvas (e.g. database, api_gateway, serverless_function, cache, queue).',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['api_gateway', 'serverless_function', 'database', 'cache', 'load_balancer', 'storage_bucket', 'auth_service', 'queue'],
            description: 'The cloud component type',
          },
          name: {
            type: 'string',
            description: 'A descriptive name for the node (e.g. "User Authentication Service" or "Redis Cache")',
          },
          region: {
            type: 'string',
            enum: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
            description: 'Cloud deployment region (default: us-east-1)',
          },
          tier: {
            type: 'string',
            enum: ['basic', 'standard', 'premium'],
            description: 'Hardware tier/capacity sizing (default: standard)',
          },
          replicas: {
            type: 'number',
            description: 'Number of redundant instances or replicas (default: 1)',
          },
          positionX: {
            type: 'number',
            description: 'Optional canvas X coordinate',
          },
          positionY: {
            type: 'number',
            description: 'Optional canvas Y coordinate',
          },
        },
        required: ['type', 'name'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input, store, callerSource = 'WebMCP') => {
        const position = input.positionX !== undefined && input.positionY !== undefined
          ? { x: input.positionX, y: input.positionY }
          : undefined;

        const node = store.addNode({
          type: input.type as NodeType,
          name: input.name,
          region: input.region,
          tier: input.tier,
          replicas: input.replicas,
          position,
        });

        const msg = `Created node "${node.name}" (${node.type}) [ID: ${node.id}, Cost: $${node.monthlyCost}/mo]`;
        store.addLog(callerSource, msg);
        return msg;
      },
    },

    {
      name: 'connect_architecture_nodes',
      title: 'Connect Architecture Nodes',
      description: 'Creates a directional data flow or network connection between two existing architecture nodes.',
      inputSchema: {
        type: 'object',
        properties: {
          sourceNodeId: {
            type: 'string',
            description: 'The ID of the upstream/source node (e.g. "gateway-1")',
          },
          targetNodeId: {
            type: 'string',
            description: 'The ID of the downstream/target node (e.g. "db-1")',
          },
          protocol: {
            type: 'string',
            enum: ['https', 'grpc', 'websocket', 'sql', 'redis'],
            description: 'Network communication protocol (default: https)',
          },
          encrypted: {
            type: 'boolean',
            description: 'Whether transport encryption (TLS/mTLS) is enabled (default: true)',
          },
        },
        required: ['sourceNodeId', 'targetNodeId'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input, store, callerSource = 'WebMCP') => {
        const conn = store.connectNodes({
          source: input.sourceNodeId,
          target: input.targetNodeId,
          protocol: input.protocol,
          encrypted: input.encrypted,
        });

        const msg = `Connected ${conn.source} -> ${conn.target} via ${conn.protocol} (Encrypted: ${conn.encrypted})`;
        store.addLog(callerSource, msg);
        return msg;
      },
    },

    {
      name: 'update_architecture_node',
      title: 'Update Architecture Node',
      description: 'Modifies the scaling, region, or tier settings of an existing node on the canvas.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The ID of the node to modify',
          },
          replicas: {
            type: 'number',
            description: 'New replica count',
          },
          tier: {
            type: 'string',
            enum: ['basic', 'standard', 'premium'],
            description: 'New hardware tier sizing',
          },
          name: {
            type: 'string',
            description: 'Updated display name',
          },
        },
        required: ['nodeId'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input, store, callerSource = 'WebMCP') => {
        const updated = store.updateNode(input.nodeId, {
          replicas: input.replicas,
          tier: input.tier,
          name: input.name,
        });

        const msg = `Updated node "${updated.name}" [Replicas: ${updated.replicas}, Tier: ${updated.tier}, Cost: $${updated.monthlyCost}/mo]`;
        store.addLog(callerSource, msg);
        return msg;
      },
    },

    {
      name: 'remove_architecture_node',
      title: 'Remove Architecture Node',
      description: 'Deletes a node and its attached connections from the architecture diagram.',
      inputSchema: {
        type: 'object',
        properties: {
          nodeId: {
            type: 'string',
            description: 'The ID of the node to remove',
          },
        },
        required: ['nodeId'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input, store, callerSource = 'WebMCP') => {
        const result = store.removeNode(input.nodeId);
        const msg = `Removed node ${result.deletedNodeId} and ${result.removedConnections} attached link(s)`;
        store.addLog(callerSource, msg);
        return msg;
      },
    },

    {
      name: 'run_architecture_security_audit',
      title: 'Run Security Audit',
      description: 'Analyzes topology, network link encryption, database exposure, and redundancy for security vulnerabilities.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (_, store, callerSource = 'WebMCP') => {
        const { issues, score } = store.runSecurityAudit();
        const msg = `Security Audit Score: ${score}/100 with ${issues.length} issue(s) detected.`;
        store.addLog(callerSource, msg);

        return JSON.stringify({
          securityScore: score,
          issuesCount: issues.length,
          issues: issues.map((iss) => ({
            severity: iss.severity,
            title: iss.title,
            description: iss.description,
            remediation: iss.remediation,
          })),
        }, null, 2);
      },
    },

    {
      name: 'estimate_architecture_cost',
      title: 'Estimate Cloud Cost',
      description: 'Calculates the estimated total monthly cloud infrastructure budget and per-node breakdown.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (_, store, callerSource = 'WebMCP') => {
        const { totalMonthlyCost, breakdown } = store.estimateCost();
        const msg = `Calculated total monthly cost: $${totalMonthlyCost}/mo across ${breakdown.length} components.`;
        store.addLog(callerSource, msg);

        return JSON.stringify({
          totalMonthlyCostUSD: totalMonthlyCost,
          breakdown,
        }, null, 2);
      },
    },

    {
      name: 'export_architecture_terraform',
      title: 'Export Terraform',
      description: 'Generates valid Terraform HCL infrastructure-as-code definitions matching the active visual topology.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute: async (_, store, callerSource = 'WebMCP') => {
        const tf = store.exportTerraform();
        store.addLog(callerSource, 'Exported infrastructure to Terraform HCL specification');
        return tf;
      },
    },

    {
      name: 'load_architecture_template',
      title: 'Load Architecture Template',
      description: 'Replaces or loads a pre-configured architecture pattern (e.g. "ai_pipeline" or "clear").',
      inputSchema: {
        type: 'object',
        properties: {
          templateName: {
            type: 'string',
            enum: ['ai_pipeline', 'clear'],
            description: 'Name of the template to load',
          },
        },
        required: ['templateName'],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute: async (input, store, callerSource = 'WebMCP') => {
        store.reset(input.templateName);
        const msg = `Loaded architecture template: "${input.templateName}"`;
        store.addLog(callerSource, msg);
        return msg;
      },
    },
  ];
}
