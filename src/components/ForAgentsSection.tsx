import { useState } from 'react';
import { ArrowUpRight, Copy, Check, Terminal, Code2 } from 'lucide-react';

interface EndpointRow {
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

const ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET',
    path: '/api/v1/lookup?url=...',
    description: 'Does this URL expose WebMCP?',
  },
  {
    method: 'GET',
    path: '/api/v1/sites?type=live',
    description: 'List live WebMCP sites',
  },
  {
    method: 'GET',
    path: '/api/v1/sites/{host}',
    description: "One site's full capabilities",
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Directory-wide counts + top sites',
  },
];

const JS_SNIPPET = `// Browser WebMCP Tool Invocation
const tools = await window.document.modelContext.getTools();
const result = await window.document.modelContext.executeTool('submit_student_verification', {
  studentName: 'Alex Mercer',
  schoolId: 'stanford-univ',
  documentId: 'doc_stanford_id_2026'
});`;

export default function ForAgentsSection() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(JS_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="for-agents">
      {/* Section Title */}
      <h2 className="font-serif-editorial text-3xl sm:text-4xl font-normal text-neutral-900 mb-6">
        For Agents
      </h2>

      {/* Main Container */}
      <div className="bg-white border border-black shadow-[4px_4px_0px_0px_#000000] divide-y divide-black">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#FBFBFA] flex items-center justify-between flex-wrap gap-2">
          <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <span>—</span>
            <span>API FOR AGENTS</span>
          </div>
          <a
            href="#api-docs"
            onClick={(e) => e.preventDefault()}
            className="font-mono text-xs text-neutral-700 hover:text-[#0066FF] flex items-center gap-1 transition-colors"
          >
            <span>Full API docs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Description Paragraph */}
        <div className="px-6 py-4 bg-white text-xs sm:text-sm text-neutral-700 font-sans leading-relaxed">
          <p>
            Query the directory programmatically — list sites, inspect each tool's input schema,
            probe a URL with{' '}
            <code className="font-mono text-[#0066FF] bg-blue-50 px-1 py-0.5 border border-blue-200">
              /api/v1/lookup
            </code>
            , or pull aggregate counts. Read-only JSON, no auth, CORS open. Stub-only sites
            (modelContext present but no registered tools) are excluded.
          </p>
        </div>

        {/* Endpoints Table */}
        <div className="divide-y divide-neutral-200">
          {ENDPOINTS.map((endpoint, idx) => (
            <div
              key={idx}
              className="px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/80 transition-colors"
            >
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-200 text-neutral-800 border border-neutral-300">
                  {endpoint.method}
                </span>
                <span className="text-neutral-900 font-medium">{endpoint.path}</span>
              </div>
              <div className="font-mono text-xs text-neutral-500 flex items-center gap-1 sm:justify-end">
                <span>{endpoint.description}</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>
          ))}
        </div>

        {/* WebMCP JavaScript Invocation Snippet */}
        <div className="p-6 bg-[#FAFAF8] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-800 font-bold uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-[#0066FF]" />
              <span>Browser WebMCP Tool Invocation</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs font-mono border border-black bg-white hover:bg-neutral-100 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000] cursor-pointer transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-neutral-900 text-neutral-100 rounded font-mono text-xs leading-relaxed overflow-x-auto border border-black">
            <code>{JS_SNIPPET}</code>
          </pre>
        </div>

        {/* Spec Footer Reference */}
        <div className="px-6 py-3.5 bg-[#FBFBFA] flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <div>
            OpenAPI 3.1 spec at{' '}
            <span className="text-neutral-800 font-medium">/api/openapi.json</span> · full reference at{' '}
            <span className="text-neutral-800 font-medium">/api-docs</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-600">
            <Code2 className="w-3.5 h-3.5" />
            <span>document.modelContext v1.0</span>
          </div>
        </div>
      </div>
    </section>
  );
}
