import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';
import { globalStore } from '../src/shared/state.ts';
import { createArchitectureTools } from '../src/shared/tools.ts';

const tools = createArchitectureTools();
const WS_PORT = Number(process.env.WS_PORT) || 8765;

// Optional connection to local UI WebSocket server
let wsClient: WebSocket | null = null;
function initWsClient() {
  try {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    ws.on('open', () => {
      wsClient = ws;
    });
    ws.on('error', () => {
      wsClient = null;
    });
    ws.on('close', () => {
      wsClient = null;
    });
  } catch {
    wsClient = null;
  }
}
initWsClient();

const server = new Server(
  {
    name: 'webmcp-architecture-studio-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 1. Expose all tools to CLI Agents (Claude Code, Codex, Antigravity)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

// 2. Handle Tool Invocations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const targetTool = tools.find((t) => t.name === name);

  if (!targetTool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool "${name}" not found`);
  }

  try {
    const result = await targetTool.execute(args || {}, globalStore, 'MCP-Bridge');

    // Notify connected browser instance over WebSocket if active
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(
        JSON.stringify({
          type: 'EXTERNAL_AGENT_ACTION',
          toolName: name,
          args,
          result,
          state: globalStore.getState(),
        }),
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Execution error in "${name}": ${error.message}`,
        },
      ],
    };
  }
});

// Start Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
