export type NodeType =
  | 'api_gateway'
  | 'serverless_function'
  | 'database'
  | 'cache'
  | 'load_balancer'
  | 'storage_bucket'
  | 'auth_service'
  | 'queue';

export interface ArchitectureNode {
  id: string;
  type: NodeType;
  name: string;
  region: string;
  tier: string;
  replicas: number;
  monthlyCost: number;
  status: 'active' | 'warning' | 'error';
  position: { x: number; y: number };
}

export interface ArchitectureConnection {
  id: string;
  source: string;
  target: string;
  protocol: 'https' | 'grpc' | 'websocket' | 'sql' | 'redis';
  encrypted: boolean;
}

export interface SecurityIssue {
  severity: 'high' | 'medium' | 'low';
  nodeId?: string;
  title: string;
  description: string;
  remediation: string;
}

export interface ArchitectureState {
  nodes: ArchitectureNode[];
  connections: ArchitectureConnection[];
  selectedNodeId: string | null;
  logs: Array<{ timestamp: string; source: 'WebMCP' | 'UI'; message: string }>;
}

const BASE_COSTS: Record<NodeType, Record<string, number>> = {
  api_gateway: { basic: 15, standard: 35, premium: 90 },
  serverless_function: { basic: 5, standard: 20, premium: 60 },
  database: { basic: 25, standard: 80, premium: 250 },
  cache: { basic: 15, standard: 45, premium: 120 },
  load_balancer: { basic: 20, standard: 40, premium: 100 },
  storage_bucket: { basic: 5, standard: 15, premium: 45 },
  auth_service: { basic: 10, standard: 30, premium: 75 },
  queue: { basic: 10, standard: 25, premium: 60 },
};

export class ArchitectureStore {
  private state: ArchitectureState;
  private listeners: Set<(state: ArchitectureState) => void> = new Set();

  constructor(initialState?: Partial<ArchitectureState>) {
    this.state = {
      nodes: initialState?.nodes || [
        {
          id: 'gateway-1',
          type: 'api_gateway',
          name: 'Public API Gateway',
          region: 'us-east-1',
          tier: 'standard',
          replicas: 2,
          monthlyCost: 70,
          status: 'active',
          position: { x: 50, y: 140 },
        },
        {
          id: 'auth-1',
          type: 'auth_service',
          name: 'OAuth2 / JWT Auth',
          region: 'us-east-1',
          tier: 'standard',
          replicas: 2,
          monthlyCost: 60,
          status: 'active',
          position: { x: 260, y: 50 },
        },
        {
          id: 'service-1',
          type: 'serverless_function',
          name: 'Core API Service',
          region: 'us-east-1',
          tier: 'standard',
          replicas: 3,
          monthlyCost: 60,
          status: 'active',
          position: { x: 260, y: 220 },
        },
        {
          id: 'db-1',
          type: 'database',
          name: 'PostgreSQL Primary',
          region: 'us-east-1',
          tier: 'standard',
          replicas: 1,
          monthlyCost: 80,
          status: 'active',
          position: { x: 480, y: 140 },
        },
      ],
      connections: initialState?.connections || [
        { id: 'c1', source: 'gateway-1', target: 'auth-1', protocol: 'https', encrypted: true },
        { id: 'c2', source: 'gateway-1', target: 'service-1', protocol: 'https', encrypted: true },
        { id: 'c3', source: 'service-1', target: 'db-1', protocol: 'sql', encrypted: true },
      ],
      selectedNodeId: null,
      logs: initialState?.logs || [
        {
          timestamp: new Date().toLocaleTimeString(),
          source: 'UI',
          message: 'Architecture Studio initialized with standard 3-tier microservice layout',
        },
      ],
    };
  }

  getState(): ArchitectureState {
    return { ...this.state };
  }

  subscribe(listener: (state: ArchitectureState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  addLog(source: 'WebMCP' | 'UI', message: string) {
    this.state.logs = [
      ...this.state.logs.slice(-25),
      { timestamp: new Date().toLocaleTimeString(), source, message },
    ];
    this.notify();
  }

  addNode(node: {
    type: NodeType;
    name: string;
    region?: string;
    tier?: 'basic' | 'standard' | 'premium';
    replicas?: number;
    position?: { x: number; y: number };
  }): ArchitectureNode {
    const tier = node.tier || 'standard';
    const replicas = node.replicas || 1;
    const baseCost = BASE_COSTS[node.type]?.[tier] || 25;
    const monthlyCost = baseCost * replicas;

    const id = `${node.type.replace('_', '-')}-${Date.now().toString().slice(-4)}`;
    const position = node.position || {
      x: 100 + (this.state.nodes.length % 4) * 140,
      y: 100 + Math.floor(this.state.nodes.length / 4) * 120,
    };

    const newNode: ArchitectureNode = {
      id,
      type: node.type,
      name: node.name,
      region: node.region || 'us-east-1',
      tier,
      replicas,
      monthlyCost,
      status: 'active',
      position,
    };

    this.state.nodes = [...this.state.nodes, newNode];
    this.notify();
    return newNode;
  }

  updateNode(id: string, updates: Partial<Omit<ArchitectureNode, 'id'>>): ArchitectureNode {
    const target = this.state.nodes.find((n) => n.id === id);
    if (!target) throw new Error(`Node with ID "${id}" not found`);

    const type = updates.type || target.type;
    const tier = updates.tier || target.tier;
    const replicas = updates.replicas !== undefined ? updates.replicas : target.replicas;
    const baseCost = BASE_COSTS[type]?.[tier] || 25;
    const monthlyCost = baseCost * replicas;

    const updatedNode: ArchitectureNode = {
      ...target,
      ...updates,
      tier,
      replicas,
      monthlyCost,
    };

    this.state.nodes = this.state.nodes.map((n) => (n.id === id ? updatedNode : n));
    this.notify();
    return updatedNode;
  }

  removeNode(id: string): { deletedNodeId: string; removedConnections: number } {
    const nodeExists = this.state.nodes.some((n) => n.id === id);
    if (!nodeExists) throw new Error(`Node with ID "${id}" not found`);

    const prevConnectionsCount = this.state.connections.length;
    this.state.nodes = this.state.nodes.filter((n) => n.id !== id);
    this.state.connections = this.state.connections.filter((c) => c.source !== id && c.target !== id);
    const removedConnections = prevConnectionsCount - this.state.connections.length;

    if (this.state.selectedNodeId === id) {
      this.state.selectedNodeId = null;
    }

    this.notify();
    return { deletedNodeId: id, removedConnections };
  }

  connectNodes(connection: {
    source: string;
    target: string;
    protocol?: 'https' | 'grpc' | 'websocket' | 'sql' | 'redis';
    encrypted?: boolean;
  }): ArchitectureConnection {
    const sourceNode = this.state.nodes.find((n) => n.id === connection.source);
    const targetNode = this.state.nodes.find((n) => n.id === connection.target);

    if (!sourceNode) throw new Error(`Source node "${connection.source}" does not exist`);
    if (!targetNode) throw new Error(`Target node "${connection.target}" does not exist`);
    if (connection.source === connection.target) throw new Error('Cannot connect a node to itself');

    const exists = this.state.connections.some(
      (c) => c.source === connection.source && c.target === connection.target,
    );
    if (exists) throw new Error(`Connection between "${connection.source}" and "${connection.target}" already exists`);

    const newConnection: ArchitectureConnection = {
      id: `conn-${Date.now().toString().slice(-4)}`,
      source: connection.source,
      target: connection.target,
      protocol: connection.protocol || 'https',
      encrypted: connection.encrypted !== false,
    };

    this.state.connections = [...this.state.connections, newConnection];
    this.notify();
    return newConnection;
  }

  selectNode(id: string | null) {
    this.state.selectedNodeId = id;
    this.notify();
  }

  runSecurityAudit(): { issues: SecurityIssue[]; score: number } {
    const issues: SecurityIssue[] = [];

    // Check for databases directly exposed to public API gateway
    for (const conn of this.state.connections) {
      const src = this.state.nodes.find((n) => n.id === conn.source);
      const tgt = this.state.nodes.find((n) => n.id === conn.target);
      if (src?.type === 'api_gateway' && tgt?.type === 'database') {
        issues.push({
          severity: 'high',
          nodeId: tgt.id,
          title: 'Direct Database Exposure to Gateway',
          description: `Gateway "${src.name}" connects directly to Database "${tgt.name}" without an intermediary application or service layer.`,
          remediation: 'Insert a microservice or serverless function between the API Gateway and the database.',
        });
      }

      if (!conn.encrypted) {
        issues.push({
          severity: 'medium',
          title: 'Unencrypted Connection',
          description: `Connection from ${conn.source} to ${conn.target} uses unencrypted transport.`,
          remediation: 'Enable TLS/SSL encryption on this link.',
        });
      }
    }

    // Check for single points of failure (1 replica databases or critical services)
    for (const node of this.state.nodes) {
      if (node.replicas === 1 && (node.type === 'database' || node.type === 'api_gateway')) {
        issues.push({
          severity: 'medium',
          nodeId: node.id,
          title: 'Single Point of Failure (No High Availability)',
          description: `Node "${node.name}" is running with only 1 replica.`,
          remediation: 'Increase replica count to at least 2 for multi-AZ failover.',
        });
      }
    }

    // Check if caching is present
    const hasCache = this.state.nodes.some((n) => n.type === 'cache');
    const hasDB = this.state.nodes.some((n) => n.type === 'database');
    if (hasDB && !hasCache) {
      issues.push({
        severity: 'low',
        title: 'Missing Caching Layer',
        description: 'Architecture has primary database without a Redis/Memcached layer to offload high read traffic.',
        remediation: 'Add a cache node before the database.',
      });
    }

    let penalty = 0;
    for (const issue of issues) {
      if (issue.severity === 'high') penalty += 25;
      else if (issue.severity === 'medium') penalty += 15;
      else penalty += 5;
    }

    const score = Math.max(10, 100 - penalty);
    return { issues, score };
  }

  estimateCost(): { totalMonthlyCost: number; breakdown: Array<{ id: string; name: string; cost: number }> } {
    const breakdown = this.state.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      cost: node.monthlyCost,
    }));

    const totalMonthlyCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
    return { totalMonthlyCost, breakdown };
  }

  exportTerraform(): string {
    let tf = '# Generated by WebMCP Architecture Studio\nterraform {\n  required_version = ">= 1.5.0"\n}\n\n';

    for (const node of this.state.nodes) {
      const cleanId = node.id.replace(/-/g, '_');
      tf += `resource "aws_${node.type}" "${cleanId}" {\n`;
      tf += `  name     = "${node.name}"\n`;
      tf += `  region   = "${node.region}"\n`;
      tf += `  tier     = "${node.tier}"\n`;
      tf += `  replicas = ${node.replicas}\n`;
      tf += `}\n\n`;
    }

    return tf;
  }

  reset(templateName?: string) {
    if (templateName === 'ai_pipeline') {
      this.state.nodes = [
        { id: 'gateway-1', type: 'api_gateway', name: 'Inference API Gateway', region: 'us-west-2', tier: 'standard', replicas: 2, monthlyCost: 70, status: 'active', position: { x: 40, y: 140 } },
        { id: 'queue-1', type: 'queue', name: 'Prompt Job Queue', region: 'us-west-2', tier: 'standard', replicas: 1, monthlyCost: 25, status: 'active', position: { x: 220, y: 80 } },
        { id: 'fn-1', type: 'serverless_function', name: 'Embedding Worker', region: 'us-west-2', tier: 'premium', replicas: 4, monthlyCost: 240, status: 'active', position: { x: 220, y: 220 } },
        { id: 'db-vec', type: 'database', name: 'Vector Database (pgvector)', region: 'us-west-2', tier: 'premium', replicas: 2, monthlyCost: 500, status: 'active', position: { x: 440, y: 140 } },
        { id: 'cache-1', type: 'cache', name: 'Semantic Cache (Redis)', region: 'us-west-2', tier: 'standard', replicas: 2, monthlyCost: 90, status: 'active', position: { x: 440, y: 20 } },
      ];
      this.state.connections = [
        { id: 'c1', source: 'gateway-1', target: 'queue-1', protocol: 'https', encrypted: true },
        { id: 'c2', source: 'gateway-1', target: 'fn-1', protocol: 'grpc', encrypted: true },
        { id: 'c3', source: 'fn-1', target: 'db-vec', protocol: 'sql', encrypted: true },
        { id: 'c4', source: 'gateway-1', target: 'cache-1', protocol: 'redis', encrypted: true },
      ];
    } else if (templateName === 'clear') {
      this.state.nodes = [];
      this.state.connections = [];
    }

    this.notify();
  }
}

export const globalStore = new ArchitectureStore();
