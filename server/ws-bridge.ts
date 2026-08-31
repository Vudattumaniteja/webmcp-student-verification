import { WebSocketServer, WebSocket } from 'ws';
import { ArchitectureStore, globalStore } from '../src/shared/state.ts';
import { createArchitectureTools } from '../src/shared/tools.ts';

const PORT = Number(process.env.WS_PORT) || 8765;
const wss = new WebSocketServer({ port: PORT });
const tools = createArchitectureTools();

console.log(`[WebSocket Bridge] Server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket Bridge] Web client connected');

  // Send current state to newly connected frontend
  ws.send(JSON.stringify({ type: 'INIT_STATE', state: globalStore.getState() }));

  ws.on('message', async (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'EXECUTE_TOOL') {
        const targetTool = tools.find((t) => t.name === msg.toolName);
        if (targetTool) {
          const result = await targetTool.execute(msg.args, globalStore, msg.source || 'MCP-Bridge');
          // Broadcast state update to all connected browser windows
          broadcastState();
          ws.send(JSON.stringify({ type: 'TOOL_RESULT', id: msg.id, result }));
        }
      }
    } catch (e: any) {
      console.error('[WebSocket Bridge] Error handling message:', e.message);
    }
  });
});

export function broadcastState() {
  const payload = JSON.stringify({ type: 'STATE_UPDATE', state: globalStore.getState() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
