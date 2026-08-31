import { useState, useEffect } from 'react';
import { Bot, CheckCircle2, AlertTriangle, Play, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [hasWebMCP, setHasWebMCP] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    const isSupported = typeof document !== 'undefined' && 'modelContext' in document && !!document.modelContext;
    setHasWebMCP(isSupported);

    if (isSupported && document.modelContext) {
      // Register an initial test tool
      const toolDef: WebMCP.ModelContextTool = {
        name: 'ping_status',
        title: 'Ping Status',
        description: 'Verifies connectivity and retrieves application health and stats.',
        inputSchema: {
          type: 'object',
          properties: {
            echo: { type: 'string', description: 'Optional message to echo back' },
          },
        },
        execute: async (input: { echo?: string }) => {
          const echoVal = input?.echo || 'default';
          addLog(`ping_status executed with argument: "${echoVal}"`);
          return `WebMCP Studio online. Echo: ${echoVal}`;
        },
        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },
      };

      document.modelContext
        .registerTool(toolDef)
        .then(() => {
          setRegisteredTools((prev) => Array.from(new Set([...prev, toolDef.name])));
          addLog('Registered WebMCP tool: ping_status');
        })
        .catch((err) => {
          console.error('Registration failed:', err);
        });
    }
  }, []);

  const handleManualTest = async () => {
    if (!hasWebMCP || !document.modelContext) {
      addLog('WebMCP not detected. Enable chrome://flags/#enable-webmcp-testing in Chrome 149+');
      return;
    }

    try {
      const tools = await document.modelContext.getTools();
      const target = tools.find((t) => t.name === 'ping_status');
      if (target) {
        addLog('Invoking ping_status...');
        const mc = document.modelContext as any;
        if (typeof mc.executeTool === 'function') {
          const result = await mc.executeTool(target, JSON.stringify({ echo: 'Hello from in-app runner' }));
          addLog(`Result: ${result}`);
        } else {
          addLog(`Tool "${target.name}" is active and registered with the browser model context.`);
        }
      }
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">WebMCP Studio</h1>
            <p className="text-xs text-slate-400">Agent-Native Web Application</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              hasWebMCP
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/50 border-amber-800 text-amber-300'
            }`}
          >
            {hasWebMCP ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>WebMCP Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>WebMCP Flag Needed</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Status & Registered Tools */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-200 font-medium">
            <Bot className="h-4 w-4 text-indigo-400" />
            <h2>Registered Agent Tools ({registeredTools.length})</h2>
          </div>

          <div className="flex flex-col gap-2">
            {registeredTools.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No tools registered yet.</p>
            ) : (
              registeredTools.map((tool) => (
                <div
                  key={tool}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-mono text-indigo-300">{tool}</p>
                    <p className="text-xs text-slate-400">Imperative tool</p>
                  </div>
                  <button
                    onClick={handleManualTest}
                    className="p-1.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="h-3 w-3" />
                    <span>Test</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {!hasWebMCP && (
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-200/90 leading-relaxed">
              <p className="font-semibold mb-1">To enable WebMCP in Chrome:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-300/80">
                <li>Open <code className="bg-amber-900/50 px-1 py-0.5 rounded">chrome://flags/#enable-webmcp-testing</code></li>
                <li>Set to <strong>Enabled</strong> and relaunch.</li>
              </ol>
            </div>
          )}
        </section>

        {/* Middle & Right: Workspace & Execution Console */}
        <section className="md:col-span-2 flex flex-col gap-6">
          {/* Active Canvas / Workspace Preview */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Interactive Workspace</h2>
            <div className="border border-dashed border-slate-700 rounded-lg p-8 text-center text-slate-400 bg-slate-950/40">
              <Sparkles className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">Ready to build your agent-collaborative interface.</p>
              <p className="text-xs text-slate-500 mt-1">Tools modify application state in real time as the agent invokes them.</p>
            </div>
          </div>

          {/* Real-Time Event Log */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h2>Activity Log</h2>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 flex-1 overflow-y-auto min-h-[160px] max-h-[260px] border border-slate-800/80 flex flex-col gap-1.5">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic">Waiting for events...</span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
